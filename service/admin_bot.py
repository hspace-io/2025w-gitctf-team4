import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

class AdminBot:
    def __init__(self, base_url, flag_path, admin_email, admin_password):
        self.base_url = base_url
        self.flag_path = flag_path
        self.admin_email = admin_email
        self.admin_password = admin_password
        self.driver = None
        
    def setup_driver(self):
        """Chrome 드라이버 설정"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # 헤드리스 모드
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # 로그 레벨 설정
        chrome_options.add_argument('--log-level=3')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        print("[Bot] Chrome driver initialized")
        
    def read_flag(self):
        """플래그 파일 읽기"""
        try:
            with open(self.flag_path, 'r', encoding='utf-8') as f:
                flag = f.read().strip()
            print(f"[Bot] Flag loaded from {self.flag_path}")
            return flag
        except FileNotFoundError:
            print(f"[Bot] ERROR: Flag file not found at {self.flag_path}")
            raise
        except Exception as e:
            print(f"[Bot] ERROR reading flag: {e}")
            raise
    
    def login(self):
        """관리자 로그인"""
        try:
            print(f"[Bot] Navigating to {self.base_url}/login")
            self.driver.get(f"{self.base_url}/login")
            
            # 페이지 로드 대기
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            
            # 로그인 폼 입력
            email_input = self.driver.find_element(By.NAME, "email")
            password_input = self.driver.find_element(By.NAME, "password")
            
            email_input.send_keys(self.admin_email)
            password_input.send_keys(self.admin_password)
            
            # 로그인 버튼 클릭
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            
            # 로그인 완료 대기 (main 페이지로 리다이렉트)
            WebDriverWait(self.driver, 10).until(
                EC.url_contains("/main")
            )
            
            print("[Bot] Login successful")
            return True
            
        except Exception as e:
            print(f"[Bot] Login failed: {e}")
            return False
    
    def set_flag_cookie(self, flag):
        """쿠키에 플래그 설정"""
        try:
            # 쿠키 설정
            self.driver.add_cookie({
                'name': 'FLAG',
                'value': flag,
                'path': '/',
                'httpOnly': False,  # JavaScript에서 접근 가능하게
                'secure': False
            })
            print(f"[Bot] FLAG cookie set: {flag}")
            return True
        except Exception as e:
            print(f"[Bot] Failed to set cookie: {e}")
            return False
    
    def visit_admin_page(self):
        try:
            print(f"[Bot] Visiting {self.base_url}/admin")
            self.driver.get(f"{self.base_url}/admin")

            # 페이지 로드 대기
            time.sleep(2)
            print("[Bot] Admin page visited")

            # 1) 미션 삭제 버튼 클릭
            delete_btn = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(
                    (By.XPATH, "//button[contains(text(), '모든 미션 삭제') or contains(text(), '모든 제출 내역 삭제')]")
                )
            )
            delete_btn.click()
            print("[Bot] Delete button clicked")

            # 2) 첫 번째 confirm() 알럿 (정말 삭제하시겠습니까?)
            try:
                confirm_alert = WebDriverWait(self.driver, 5).until(EC.alert_is_present())
                print("[Bot] Confirm alert text:", confirm_alert.text)
                confirm_alert.accept()
                print("[Bot] Confirm popup accepted")
            except TimeoutException:
                print("[Bot] No confirm alert appeared.")

            # 3) 두 번째 alert() (제출 내역 전체 삭제 완료! ...)
            #    짧은 타임아웃으로 시도하고, 없으면 그냥 넘어감
            try:
                success_alert = WebDriverWait(self.driver, 5).until(EC.alert_is_present())
                print("[Bot] Success alert text:", success_alert.text)
                success_alert.accept()
                print("[Bot] Success alert accepted")
            except TimeoutException:
                print("[Bot] No success alert appeared.")

            # 서버 처리 시간 여유
            time.sleep(1)

            return True

        except UnexpectedAlertPresentException as e:
                # 혹시 위에서 놓친 alert가 있으면 여기서 처리
            print(f"[Bot] Unexpected alert present: {e}")
            try:
                alert = self.driver.switch_to.alert
                print("[Bot] Unexpected alert text:", alert.text)
                alert.accept()
                print("[Bot] Unexpected alert accepted")
            except NoAlertPresentException:
                pass
            return False

        except Exception as e:
            print(f"[Bot] Failed to visit admin page: {e}")
            return False
    
    def run(self, interval=10):
        """봇 실행"""
        try:
            # 드라이버 설정
            self.setup_driver()
            
            # 플래그 읽기
            flag = self.read_flag()
            
            # 로그인
            if not self.login():
                print("[Bot] Cannot continue without login")
                return
            
            # 플래그 쿠키 설정
            if not self.set_flag_cookie(flag):
                print("[Bot] Warning: Failed to set FLAG cookie")
            
            print(f"[Bot] Starting periodic admin page visits (every {interval} seconds)")
            print("[Bot] Press Ctrl+C to stop")
            
            # 무한 루프로 관리자 페이지 방문
            visit_count = 0
            while True:
                visit_count += 1
                print(f"\n[Bot] Visit #{visit_count}")
                self.visit_admin_page()
                
                print(f"[Bot] Waiting {interval} seconds...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n[Bot] Stopped by user")
        except Exception as e:
            print(f"[Bot] Error: {e}")
        finally:
            if self.driver:
                self.driver.quit()
                print("[Bot] Driver closed")

def main():

    #FLAG_PATH = './2025w-gitctf-team4/service/flag.txt' #local test
    FLAG_PATH = '/var/ctf/flag' #docker

    with open(FLAG_PATH, 'r', encoding='utf-8') as f:
        flag = f.read().strip()

    BASE_URL = 'http://localhost:3000'
    ADMIN_EMAIL = 'flag@flag.com'
    ADMIN_PASSWORD = flag
    VISIT_INTERVAL = 10

    print("=" * 60)
    print("Knights Frontier - Admin Bot")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Flag Path: {FLAG_PATH}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print(f"Visit Interval: {VISIT_INTERVAL} seconds")
    print("=" * 60)
    
    bot = AdminBot(BASE_URL, FLAG_PATH, ADMIN_EMAIL, ADMIN_PASSWORD)
    bot.run(interval=VISIT_INTERVAL)

if __name__ == '__main__':
    main()

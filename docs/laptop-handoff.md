# 노트북 작업 인계 (2026-11-23)

## 현재 작업

- 저장소: https://github.com/euijeong-Kang/riorio
- 브랜치: `codex/christmas-wine-pairing`, 기준 커밋: `dbae7ed`.
- 예약 관련 소스와 테스트를 포함한 많은 변경은 커밋되지 않았다. GitHub 브랜치만 복제하면 이 변경은 따라오지 않으므로 별도로 전달된 변경 파일 압축을 복원해야 한다.
- 압축에는 변경 파일과 신규 파일만 포함된다. 환경 변수, 비밀키, 의존성, 빌드 결과, 로컬 데이터베이스는 포함하지 않는다. 이 문서 자체도 압축에 포함된다.

## 복원

1. 노트북에 Git, Node.js 20 이상과 npm 10 이상을 설치한다. 기존 작업물이 없는 폴더에서 `git clone https://github.com/euijeong-Kang/riorio.git`을 실행한다.
2. 저장소 폴더에서 `git switch -c codex/christmas-wine-pairing --track origin/codex/christmas-wine-pairing` 후 `git rev-parse HEAD`가 `dbae7ed`로 시작하는지 확인한다. 일치하지 않으면 덮어쓰기 전에 원본 상태를 확인한다.
3. 전달받은 변경 파일 압축을 저장소 루트에 풀어 같은 경로에 덮어쓴다. 새로 복제한 저장소에만 적용하고, 기존 미커밋 파일에는 덮어쓰지 않는다. `git status --short`로 변경사항을 확인한다.
4. `npm ci` 후 `npm run reservation:preview`를 실행하고 `http://127.0.0.1:4193/reservation-preview.html`을 연다. 인터넷 연결과 패키지 설치가 필요하다.
5. DB 테스트는 Windows용 PostgreSQL 17을 설치한 뒤 `scripts/reservation-local-db-check.ps1`의 PostgreSQL 경로와 포트 55439를 확인하고 실행한다. 이 스크립트는 임시 격리 DB와 가상 데이터만 사용하며 기존 DB를 대상으로 실행하면 안 된다. 종료 후 비밀번호 파일을 지우지만 임시 데이터 디렉터리는 남는다.

## 주의 및 다음 작업

- 화면은 비공개 미리보기이며 실제 예약 API, 운영 입금 확인, 승인 및 환불이 완료된 상태가 아니다. 테스트용 DB 모형의 통과를 운영 준비 완료로 해석하지 않는다.
- 행사 예약은 닫힌 상태를 유지한다. 운영 DB·실제 고객 정보 변경, 배포 및 오픈은 별도 검토와 승인이 필요하다.
- 기존 관리자 기능 재사용을 검토 중이나 기존 운영 예약 기능에는 `docs/reservation-security-response.md`에 기록된 미해결 보안 문제가 있다.
- 최근 격리 로컬 DB 검증: 승인과 취소의 두 동시 실행 순서, 권한 없는 승인, 감사 기록 실패 시 롤백을 포함한 테스트 4개 통과. 운영 연동은 검증하지 않았다.
- 예약금은 1인 30,000원 계좌이체, 관리자가 입금 확인 후 승인, 잔액은 현장 결제라는 사용자의 최신 방향을 따른다. 최종 행사 일정·회차·정원·계좌·입금 기한·환불 세부 기준 등은 실제 설정과 승인 여부를 다시 확인한다.
- 다음 작업은 실제 서버·관리자 연동의 안전한 비운영 검증과 기존 보안 대응이다. 관련 세부사항은 `docs/christmas-reservation-development-guide.md` 및 `docs/reservation-security-response.md`를 우선 확인한다.

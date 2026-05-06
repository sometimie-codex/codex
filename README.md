# Altcoin Futures Squeeze Strategy System

이 저장소는 Coinalyze, Coinglass, 거래소 선물 데이터를 조합해 월 20~40회 수준의 고선별 알트코인 선물 매매 후보를 만들기 위한 전략 설계 산출물입니다.

## 핵심 운영 원칙

- 기본 실행 모드는 **롱 우선**이지만, 롱/숏 양방향 전략을 모두 유지합니다.
- 숏 조건은 숏 진입뿐 아니라 **Long Ban**, 리스크 회피, 헷징 참고 필터로 활용합니다.
- 80점 이상은 즉시 매수 신호가 아니라 **강한 후보/알림/보유 관리 구간**입니다.
- 가장 좋은 진입은 **70~79점 구간에서 좋은 눌림과 15M 트리거가 결합될 때**입니다.
- Red Mode에서만 신규 진입을 완전히 중단하고, Green/Yellow/Orange에서는 시장 상태에 맞춰 필터 강도와 리스크를 조절합니다.
- 어떤 경우에도 1회 손실은 시드 -5%를 넘지 않도록 설계합니다.

## 저장소 구성

- `docs/strategy_blueprint_ko.md`: 한국어 전략 블루프린트와 운영 규칙.
- `config/alt_futures_strategy.v1.json`: 봇/사이트 구현에 사용할 수 있는 v1 전략 파라미터.
- `scripts/validate_strategy_config.py`: 전략 설정 파일의 핵심 불변 조건을 검증하는 스크립트.

## 기본 파이프라인

1. 전 종목 스캔
2. Market Regime 판정: Green / Yellow / Orange / Red
3. Broad / Main / A++ / Short-Ban 필터 분류
4. 유동성 / 스프레드 필터 확인
5. 스퀴즈 점수 및 점수 구간 판정
6. 1H Pullback Engine 계산
7. 15M Trigger 확인
8. 시장모드, 점수, 필터등급, 눌림점수 기반 진입 등급 결정
9. 3분할 진입 계획, SL, TP1/TP2/TP3 생성
10. 텔레그램 알림 발송


## 웹페이지 미리보기

파이썬 실행 없이도 볼 수 있습니다. 이 대시보드는 정적 HTML/CSS/JavaScript만 사용하므로 `index.html` 파일을 브라우저로 바로 열면 됩니다.

### 가장 쉬운 방법

1. 파일 탐색기에서 이 저장소 폴더를 엽니다.
2. `index.html`을 더블클릭합니다.
3. 브라우저에서 전략 대시보드를 확인합니다.

### 명령어로 열기

운영체제에 따라 아래 중 하나를 실행할 수 있습니다.

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows PowerShell
start index.html
```

로컬 서버 방식이 필요한 경우에만 아래처럼 실행합니다. 이 방식은 선택 사항입니다.

```bash
python -m http.server 4173
```

서버를 실행한 경우 브라우저에서 `http://127.0.0.1:4173/`를 열면 됩니다.

### 윈도우에서 실제로 사용하는 방법

1. 이 폴더를 압축 해제합니다.
2. `index.html`을 더블클릭합니다.
3. 상단의 **판정기** 메뉴를 누릅니다.
4. Coinalyze / Coinglass / 거래소에서 확인한 Market Regime, 필터 등급, 점수, Pullback 기준, 15M Trigger, 스프레드를 입력합니다.
5. 오른쪽 결과 카드에서 `관찰`, `진입대기`, `진입가능`, `과열주의`, `롱금지`, `Red 진입금지` 상태와 권장 리스크/TP/알림 문구를 확인합니다.

이 기능은 브라우저 안에서만 계산되므로 별도 설치, 파이썬 실행, 서버 실행이 필요 없습니다.


## 저장 / 보관 방법

웹페이지를 저장하려면 아래 파일들을 같은 폴더 구조로 보관하면 됩니다.

- `index.html`
- `assets/styles.css`
- `assets/app.js`

가장 안전한 방법은 저장소 폴더 전체를 압축하거나 복사하는 것입니다. `index.html`만 따로 옮기면 CSS/JavaScript 연결이 끊겨 화면 스타일과 필터 탭 기능이 동작하지 않을 수 있습니다.

브라우저에서 저장하려면 페이지를 연 뒤 **다른 이름으로 저장**을 선택하고, 형식은 **웹페이지, 전체**로 저장하세요. 공유용으로는 저장소 폴더 전체를 ZIP으로 압축하거나 GitHub Pages / Netlify / Vercel 같은 정적 호스팅에 올리면 됩니다.

## 검증

```bash
python scripts/validate_strategy_config.py config/alt_futures_strategy.v1.json
```

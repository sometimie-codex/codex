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

## 검증

```bash
python scripts/validate_strategy_config.py config/alt_futures_strategy.v1.json
```

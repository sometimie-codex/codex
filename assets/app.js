const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === target);
    });
  });
});

const form = document.querySelector('#strategy-form');
const output = {
  badge: document.querySelector('#decision-badge'),
  title: document.querySelector('#decision-title'),
  scoreBand: document.querySelector('#score-band-output'),
  risk: document.querySelector('#risk-output'),
  tp: document.querySelector('#tp-output'),
  copy: document.querySelector('#decision-copy'),
  checklist: document.querySelector('#decision-checklist'),
  alertStatus: document.querySelector('#alert-status-output'),
  generatedAlert: document.querySelector('#generated-alert-output'),
};

const filterLabels = {
  broad: 'Broad Radar',
  main: 'Main Long Squeeze',
  aPlusPlus: 'A++ Long Squeeze',
  shortBan: 'Short / Long Ban',
};

const regimeLabels = {
  green: 'Green',
  yellow: 'Yellow',
  orange: 'Orange',
  red: 'Red',
};

function getScoreBand(score) {
  if (score < 60) return { label: 'Ignore', action: '무시', key: 'ignore' };
  if (score < 70) return { label: 'Radar', action: '관찰만', key: 'radar' };
  if (score < 75) return { label: 'Early Main', action: 'Green 소액 1차만 검토', key: 'early' };
  if (score < 80) return { label: 'Main Entry', action: '주 진입 후보', key: 'main' };
  if (score < 88) return { label: 'Strong', action: '강한 후보 / 추격 금지', key: 'strong' };
  return { label: 'Overheat', action: '과열주의 / 신규 진입 금지', key: 'overheat' };
}

function getRisk(regime, filter) {
  if (regime === 'red') return '신규 진입 없음';
  if (regime === 'orange') return filter === 'aPlusPlus' || filter === 'shortBan' ? 'Seed -0.5~1.0%' : '진입 금지';
  if (regime === 'yellow') {
    if (filter === 'aPlusPlus') return 'Seed -2.0% 이내';
    if (filter === 'main') return 'Seed -0.75~1.0%';
    return '관찰 / 리스크 없음';
  }
  if (filter === 'aPlusPlus') return 'Seed -3.0% 이내';
  if (filter === 'main') return 'Seed -1.0~1.5%';
  if (filter === 'shortBan') return '숏 모드 ON 시 별도 산정';
  return '관찰 / 소액만';
}

function getTpStyle(regime) {
  if (regime === 'green') return 'TP2/TP3/러너 적극';
  if (regime === 'yellow') return 'TP1 빠르게 / TP2 중심';
  if (regime === 'orange') return 'TP1 짧게 / 러너 거의 없음';
  return '기존 포지션 관리만';
}

function classifyDecision(data) {
  const band = getScoreBand(data.score);
  const checklist = [];
  let status = '관찰';
  let title = 'Watchlist 후보';
  let copy = '아직 실제 진입 조건이 충분하지 않습니다. 차트와 눌림을 관찰합니다.';

  const liquidityPass = data.spread < 0.5;
  const normalPullback = data.pullback >= 2;
  const aGradePullback = data.pullback >= 3;
  const basicTrigger = data.triggers >= 1;
  const aGradeTrigger = data.triggers >= 2;

  checklist.push(liquidityPass ? '스프레드 0.5% 미만: 자동진입 허용 범위' : '스프레드 0.5% 이상: 자동진입 금지');
  checklist.push(normalPullback ? 'Pullback 핵심 기준 2개 이상 충족' : 'Pullback 핵심 기준 부족: 진입 금지');
  checklist.push(basicTrigger ? '15M Trigger 1개 이상 확인' : '15M Trigger 없음: 대기');

  if (data.regime === 'red') {
    return {
      band,
      status: 'Red 진입금지',
      title: 'Red Mode: 신규 진입 금지',
      copy: '시장 전체 디레버리징/극단 변동 가능성을 우선합니다. 자동매매 OFF, 기존 포지션 관리만 수행합니다.',
      checklist: ['Red Mode에서는 A++도 신규 진입 금지', '알림은 유지하되 진입 금지로 표시', ...checklist],
      variant: 'danger',
    };
  }

  if (!liquidityPass) {
    return {
      band,
      status: '진입금지',
      title: '유동성/스프레드 기준 미통과',
      copy: '스프레드가 0.5% 이상이면 점수가 높아도 자동진입하지 않습니다.',
      checklist,
      variant: 'danger',
    };
  }

  if (data.longBan === 'on' || data.filter === 'shortBan') {
    if (data.shortMode === 'on' && data.regime !== 'green') {
      return {
        band,
        status: '숏 후보',
        title: 'Long Ban ON: 숏 후보로만 검토',
        copy: '롱 신규 진입은 금지하고, 저항/거래량 약화/하락 전환 트리거가 있을 때만 숏을 초저위험으로 검토합니다.',
        checklist: ['롱 신규 진입 금지', '기존 롱은 익절 우선', '숏 모드 ON 확인', ...checklist],
        variant: 'warning',
      };
    }
    return {
      band,
      status: '롱금지',
      title: 'Long Ban: 신규 롱 금지',
      copy: '롱 과열 또는 롱스퀴즈 위험 구간입니다. 숏 모드가 꺼져 있으면 관찰/리스크 회피만 수행합니다.',
      checklist: ['신규 롱 금지', '기존 롱 익절 우선', '숏 모드 OFF: 숏 진입도 대기', ...checklist],
      variant: 'danger',
    };
  }

  if (data.filter === 'broad') {
    return {
      band,
      status: '관찰',
      title: 'Broad Radar: 관심 종목 등록',
      copy: 'Broad는 매수 신호가 아닙니다. Main 이상으로 강화되고 좋은 눌림이 만들어질 때까지 대기합니다.',
      checklist,
      variant: 'neutral',
    };
  }

  if (band.key === 'overheat') {
    return {
      band,
      status: '과열주의',
      title: '88점 이상 과열 구간: 신규 진입 금지',
      copy: 'TP/리스크 제거/재눌림 대기를 우선합니다. A++라도 추격하지 않습니다.',
      checklist: ['88점 이상은 Overheat', '신규 추격 금지', ...checklist],
      variant: 'danger',
    };
  }

  if (data.regime === 'orange') {
    if (data.filter === 'aPlusPlus' && band.key === 'strong' && aGradePullback && aGradeTrigger) {
      return {
        band,
        status: '진입가능',
        title: 'Orange A++ 초저위험 롱 후보',
        copy: '시장 위험이 높으므로 Seed -0.5~1.0% 내에서 TP1을 짧게 잡는 조건부 후보입니다.',
        checklist: ['Orange 일반 롱 금지', 'A++ + 눌림 + 15M 2개 확인', ...checklist],
        variant: 'warning',
      };
    }
    return {
      band,
      status: '진입대기',
      title: 'Orange Mode: 일반 롱 금지',
      copy: 'A++급 눌림과 15M 트리거 2개가 결합되기 전까지 신규 롱은 금지합니다.',
      checklist: ['A++ 외 롱 금지', '초저위험만 허용', ...checklist],
      variant: 'warning',
    };
  }

  if (data.regime === 'yellow' && data.score < 75) {
    return {
      band,
      status: '관찰',
      title: 'Yellow에서는 75점 미만 대부분 패스',
      copy: '시장 애매 구간에서는 Main 이상 + 75점 이상 + 좋은 눌림만 선별합니다.',
      checklist,
      variant: 'neutral',
    };
  }

  if (data.filter === 'aPlusPlus') {
    if (band.key === 'strong' && aGradePullback && aGradeTrigger) {
      status = '진입가능';
      title = 'A++ 눌림 진입 가능 후보';
      copy = '강한 후보지만 추격이 아니라 Pullback Score 3 + 15M Trigger 2개를 확인한 눌림 진입 조건입니다.';
    } else {
      status = '진입대기';
      title = 'A++ 강한 후보: 눌림 대기';
      copy = 'A++는 알림/우선순위/러너 후보입니다. Pullback 3개와 15M Trigger 2개 전까지 추격하지 않습니다.';
    }
    return { band, status, title, copy, checklist, variant: status === '진입가능' ? 'success' : 'info' };
  }

  if (data.filter === 'main' && data.score >= 70 && normalPullback && basicTrigger) {
    return {
      band,
      status: '진입가능',
      title: data.score >= 75 ? 'Main Entry 롱 후보' : 'Green 소액 1차 후보',
      copy: 'Main Filter 이상, Long Ban OFF, Pullback 2개 이상, 15M Trigger 1개 이상을 충족했습니다. 구조 SL 기준으로 비중을 산정합니다.',
      checklist,
      variant: 'success',
    };
  }

  return { band, status, title, copy, checklist, variant: 'neutral' };
}

function readForm() {
  return {
    ticker: document.querySelector('#ticker-input').value.trim().toUpperCase() || 'UNKNOWN',
    regime: document.querySelector('#regime-input').value,
    filter: document.querySelector('#filter-input').value,
    score: Number(document.querySelector('#score-input').value),
    pullback: Number(document.querySelector('#pullback-input').value),
    triggers: Number(document.querySelector('#trigger-input').value),
    spread: Number(document.querySelector('#spread-input').value),
    longBan: document.querySelector('#long-ban-input').value,
    shortMode: document.querySelector('#short-mode-input').value,
  };
}

function renderDecision() {
  if (!form || Object.values(output).some((element) => !element)) return;

  const data = readForm();
  const decision = classifyDecision(data);

  output.badge.textContent = decision.status;
  output.badge.className = `decision-badge ${decision.variant}`;
  output.title.textContent = decision.title;
  output.scoreBand.textContent = `${decision.band.label} · ${decision.band.action}`;
  output.risk.textContent = getRisk(data.regime, data.filter);
  output.tp.textContent = getTpStyle(data.regime);
  output.copy.textContent = decision.copy;
  output.alertStatus.textContent = decision.status;

  output.checklist.innerHTML = decision.checklist.map((item) => `<li>${item}</li>`).join('');
  output.generatedAlert.textContent = [
    `티커: ${data.ticker}`,
    `방향: ${data.filter === 'shortBan' ? 'Short / Long Ban' : 'Long'}`,
    `Market Regime: ${regimeLabels[data.regime]}`,
    `등급: ${filterLabels[data.filter]}`,
    `점수: ${data.score}점 (${decision.band.label})`,
    `상태: ${decision.status}`,
    '',
    `Pullback Score: 핵심 ${data.pullback}개`,
    `15M Trigger: ${data.triggers}개`,
    `Spread: ${data.spread}%`,
    `Long Ban: ${data.longBan.toUpperCase()}`,
    '',
    `권장 리스크: ${getRisk(data.regime, data.filter)}`,
    `TP 운영: ${getTpStyle(data.regime)}`,
    '',
    `결론: ${decision.title}`,
  ].join('\n');
}

if (form) {
  form.addEventListener('input', renderDecision);
  form.addEventListener('change', renderDecision);
  renderDecision();
}

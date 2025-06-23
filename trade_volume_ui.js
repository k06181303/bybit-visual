const tradeTable = document.getElementById('tradeTable');
let stats = {
  '30s': [],
  '1m': [],
  '15m': [],
  '30m': []
};

const ctx = document.getElementById('volumeChart').getContext('2d');
const volumeChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['30s', '1m', '15m', '30m'],
    datasets: [
      {
        label: '買單成交額',
        backgroundColor: 'green',
        data: [0, 0, 0, 0]
      },
      {
        label: '賣單成交額',
        backgroundColor: 'red',
        data: [0, 0, 0, 0]
      }
    ]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { labels: { color: 'white' } } },
    scales: {
      x: { ticks: { color: 'white' } },
      y: { ticks: { color: 'white' } }
    }
  }
});

const ws = new WebSocket("wss://stream.bybit.com/v5/public?category=linear");
ws.onopen = () => {
  ws.send(JSON.stringify({ op: "subscribe", args: ["publicTrade.BTCUSDT"] }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (!msg.topic || !msg.data) return;

  const trades = Array.isArray(msg.data) ? msg.data : [msg.data];
  const now = Date.now();

  trades.forEach(t => {
    const price = parseFloat(t.p);
    const qty = parseFloat(t.v);
    const side = t.S;
    const value = price * qty;

    const row = document.createElement('tr');
    row.className = side === 'Buy' ? 'buy' : 'sell';
    row.innerHTML = `<td>${price}</td><td>${qty}</td><td>${side}</td><td>${new Date().toLocaleTimeString()}</td>`;
    tradeTable.prepend(row);
    if (tradeTable.rows.length > 20) tradeTable.deleteRow(-1);

    stats['30s'].push({ t: now, v: value, s: side });
    stats['1m'].push({ t: now, v: value, s: side });
    stats['15m'].push({ t: now, v: value, s: side });
    stats['30m'].push({ t: now, v: value, s: side });
  });

  const filterSum = (key, ms, side) => {
    const list = stats[key].filter(i => now - i.t <= ms && i.s === side);
    stats[key] = stats[key].filter(i => now - i.t <= ms);
    return list.reduce((sum, i) => sum + i.v, 0);
  };

  volumeChart.data.datasets[0].data = [
    filterSum('30s', 30000, 'Buy'),
    filterSum('1m', 60000, 'Buy'),
    filterSum('15m', 900000, 'Buy'),
    filterSum('30m', 1800000, 'Buy')
  ];
  volumeChart.data.datasets[1].data = [
    filterSum('30s', 30000, 'Sell'),
    filterSum('1m', 60000, 'Sell'),
    filterSum('15m', 900000, 'Sell'),
    filterSum('30m', 1800000, 'Sell')
  ];
  volumeChart.update();
};
module.exports = {
  forbidden: [
    {
      name: 'domain-must-not-depend-on-infrastructure-or-api',
      comment:
        'Lớp Domain là trung tâm. Không được phép import bất cứ thứ gì từ Infrastructure, API hoặc Application.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/domain' },
      to: { path: '^src/modules/([^/]+)/(infrastructure|api|application)' },
    },
    {
      name: 'application-must-not-depend-on-infrastructure-or-api',
      comment:
        'Lớp Application điều phối luồng. Không được gọi trực tiếp Infrastructure hoặc API mà phải thông qua Ports (Interfaces).',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/application' },
      to: { path: '^src/modules/([^/]+)/(infrastructure|api)' },
    },
    {
      name: 'cross-module-database-access-forbidden',
      comment:
        'Các module không được chọc thẳng vào database của nhau (ví dụ: payment không được gọi repo của auth).',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/infrastructure/database',
        pathNot: '^src/modules/$1/',
      },
    },
  ],

  options: {
    tsPreCompilationDeps: true,
    reporterOptions: {
      dot: {
        theme: {
          modules: [
            // ==========================================
            // 1. LAYER ENTRY POINTS (Điểm neo của các tầng)
            // ==========================================
            {
              criteria: { source: '\\.(api|application|infrastructure)\\.ts$' },
              attributes: {
                fillcolor: '#ffd700',
                style: 'filled',
                shape: 'hexagon',
                penwidth: 2,
              }, // Vàng đậm, viền dày
            },

            // ==========================================
            // 2. TẦNG API
            // ==========================================
            {
              criteria: { source: '\\.controller\\.ts$' },
              attributes: { fillcolor: '#ffb3ba', style: 'filled' }, // Đỏ pastel
            },
            {
              criteria: { source: '\\.dto\\.ts$' },
              attributes: {
                fillcolor: '#ffdfba',
                style: 'filled',
                shape: 'note',
              }, // Cam pastel
            },

            // ==========================================
            // 3. TẦNG APPLICATION (CQRS & Ports)
            // ==========================================
            {
              criteria: { source: '\\.port\\.ts$' },
              attributes: {
                fillcolor: '#e0bbff',
                style: 'filled',
                shape: 'cds',
              }, // Tím pastel
            },
            {
              criteria: { source: '\\.command-handler\\.ts$' },
              attributes: { fillcolor: '#81c784', style: 'filled' }, // Xanh lá đậm hơn
            },
            {
              criteria: { source: '\\.command\\.ts$' },
              attributes: {
                fillcolor: '#baffc9',
                style: 'filled',
                shape: 'invhouse',
              }, // Xanh lá pastel
            },
            {
              criteria: { source: '\\.query-handler\\.ts$' },
              attributes: { fillcolor: '#64b5f6', style: 'filled' }, // Xanh biển đậm hơn
            },
            {
              criteria: { source: '\\.query\\.ts$' },
              attributes: {
                fillcolor: '#bae1ff',
                style: 'filled',
                shape: 'invhouse',
              }, // Xanh biển pastel
            },
            {
              criteria: { source: '\\.processor\\.ts$' },
              attributes: { fillcolor: '#80cbc4', style: 'filled' }, // Xanh ngọc
            },

            // ==========================================
            // 4. TẦNG INFRASTRUCTURE
            // ==========================================
            {
              criteria: { source: '\\.orm-repository\\.ts$' },
              attributes: {
                fillcolor: '#8d6e63',
                style: 'filled',
                fontcolor: 'white',
              }, // Nâu đậm, chữ trắng
            },
            {
              criteria: { source: '\\.entity\\.ts$' }, // Chỉ bắt entity của database
              attributes: {
                fillcolor: '#d7ccc8',
                style: 'filled',
                shape: 'cylinder',
              }, // Nâu nhạt, hình trụ (DB)
            },
            {
              criteria: { source: '\\.mapper\\.ts$' },
              attributes: { fillcolor: '#bcaaa4', style: 'filled' }, // Nâu vừa
            },
            {
              criteria: { source: '\\.cron\\.ts$' },
              attributes: {
                fillcolor: '#ffccbc',
                style: 'filled',
                shape: 'component',
              }, // Cam nhạt
            },
            {
              criteria: { source: '\\.adapter\\.ts$' },
              attributes: { fillcolor: '#ffe082', style: 'filled' }, // Vàng hổ phách
            },
            {
              criteria: { source: '\\.service\\.ts$' },
              attributes: { fillcolor: '#90caf9', style: 'filled' }, // Xanh dương nhạt
            },

            // ==========================================
            // 5. TẦNG DOMAIN (Bắt những file còn lại trong Domain)
            // ==========================================
            {
              criteria: { source: '\\.event-handler\\.ts$' },
              attributes: { fillcolor: '#ffd54f', style: 'filled' }, // Vàng nhạt
            },
            {
              criteria: { source: '\\.event\\.ts$' },
              attributes: {
                fillcolor: '#fff59d',
                style: 'filled',
                shape: 'cds',
              }, // Vàng chanh
            },
            {
              criteria: { source: '\\.exception\\.ts$' },
              attributes: {
                fillcolor: '#ff5252',
                style: 'filled',
                fontcolor: 'white',
              }, // Đỏ đậm, chữ trắng
            },
            {
              criteria: { source: '\\.factory\\.ts$' },
              attributes: { fillcolor: '#a7ffeb', style: 'filled' }, // Xanh cyan
            },
            {
              criteria: { source: '\\.enum\\.ts$' },
              attributes: { fillcolor: '#cfd8dc', style: 'filled' }, // Xám xanh
            },
            // Gom tất cả các file còn lại trong thư mục domain (thường là Aggregate Root, Entity, Value Object)
            {
              criteria: { source: '^src/modules/[^/]+/domain/.*\\.ts$' },
              attributes: {
                fillcolor: '#c8e6c9',
                style: 'filled',
                shape: 'box',
              }, // Xanh lá nhạt, khung chữ nhật
            },

            // ==========================================
            // 6. MODULES & CONSTANTS
            // ==========================================
            {
              criteria: { source: '\\.(constant|module)\\.ts$' },
              attributes: {
                fillcolor: '#eeeeee',
                style: 'filled',
                shape: 'folder',
              }, // Xám nhạt
            },
          ],
        },
      },
    },
  },
};

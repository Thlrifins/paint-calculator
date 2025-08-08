// app.js
document.addEventListener('DOMContentLoaded', () => {
  // state
  let walls = [];

  // elements
  const areaTypeEl = document.getElementById('areaType');
  const widthEl = document.getElementById('width');
  const heightEl = document.getElementById('height');
  const addBtn = document.getElementById('addBtn');
  const clearBtn = document.getElementById('clearBtn');
  const wallListEl = document.getElementById('wallList');
  const coatCountEl = document.getElementById('coatCount');
  const excludeEl = document.getElementById('exclude');
  const resultWrapper = document.getElementById('resultWrapper');
  const paintResultEl = document.getElementById('paintResult');
  const addTitleEl = document.getElementById('addTitle');
  const labelWidthEl = document.getElementById('labelWidth');
  const labelHeightEl = document.getElementById('labelHeight');

  // helpers
  function roundUp(num, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.ceil(num * factor) / factor;
  }

  function updateLabels() {
    const type = areaTypeEl.value;
    if (type === 'ceiling') {
      addTitleEl.textContent = 'เพิ่มฝ้าเพดาน';
      labelWidthEl.textContent = 'กว้าง/ความยาว (เมตร)';
      labelHeightEl.textContent = 'ยาว/ความกว้าง (เมตร)';
      widthEl.placeholder = 'เช่น 4.00';
      heightEl.placeholder = 'เช่น 4.00';
    } else {
      addTitleEl.textContent = 'เพิ่มผนัง';
      labelWidthEl.textContent = 'กว้าง (เมตร)';
      labelHeightEl.textContent = 'สูง (เมตร)';
      widthEl.placeholder = 'เช่น 5.00';
      heightEl.placeholder = 'เช่น 3.00';
    }
  }

  function renderList() {
    wallListEl.innerHTML = '';
    if (walls.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'ยังไม่มีรายการ';
      empty.style.background = 'transparent';
      empty.style.color = '#666';
      empty.style.fontWeight = '500';
      wallListEl.appendChild(empty);
      return;
    }

    walls.forEach((w, i) => {
      const li = document.createElement('li');

      const metaDiv = document.createElement('div');
      metaDiv.innerHTML = `<span class="wall-meta">${w.type === 'ceiling' ? 'ฝ้า' : 'ผนัง'} ${i+1}</span>
                           <span style="color:#0d47a1; margin-left:8px;">${w.width.toFixed(2)} × ${w.height.toFixed(2)}</span>
                           <small style="color:#0d47a1; margin-left:6px;">= ${w.area.toFixed(2)} ตร.ม.</small>`;

      const btn = document.createElement('button');
      btn.className = 'btn-danger';
      btn.textContent = 'ลบ';
      btn.onclick = () => {
        walls.splice(i,1);
        renderList();
        calculatePaint();
      };

      li.appendChild(metaDiv);
      li.appendChild(btn);
      wallListEl.appendChild(li);
    });
  }

  function calculatePaint() {
    if (walls.length === 0) {
      resultWrapper.style.display = 'none';
      return;
    }

    let coatCount = parseInt(coatCountEl.value, 10) || 1;
    if (coatCount < 1) coatCount = 1;

    const rawArea = walls.reduce((s, w) => s + w.area, 0);
    const excludeVal = parseFloat(excludeEl.value) || 0;

    if (excludeVal > rawArea) {
      if (!confirm('พื้นที่ที่ไม่ทามากกว่าพื้นที่รวม จะทำให้พื้นที่สุทธิติดลบ\nต้องการใช้ค่า exclude ที่ใส่ไว้หรือจะตั้งเป็นเท่าพื้นที่รวม?')) {
        // user cancelled -> don't change exclude, still calculate (will clamp)
      }
    }

    const netArea = Math.max(0, rawArea - excludeVal);

    // Coverage ตาม TOA
    const primerCoverage = 38;       // ตร.ม./แกลลอน (รองพื้น 1 รอบ)
    const perCoatTopcoatCoverage = 19; // ตร.ม./แกลลอน ต่อ 1 รอบ

    const primerGallons = netArea / primerCoverage;
    const topcoatPerOneGallons = netArea / perCoatTopcoatCoverage;
    const topcoatTotalGallons = topcoatPerOneGallons * coatCount;

    // ปัดขึ้น 1 ตำแหน่งทศนิยม
    const primerDisplay = roundUp(primerGallons,1).toFixed(1);
    const topcoatPerOneDisplay = roundUp(topcoatPerOneGallons,1).toFixed(1);
    const topcoatTotalDisplay = roundUp(topcoatTotalGallons,1).toFixed(1);

    paintResultEl.innerHTML = `
      พื้นที่รวมก่อนหัก: ${rawArea.toFixed(2)} ตร.ม.<br>
      พื้นที่หัก (ประตู/หน้าต่าง): ${excludeVal.toFixed(2)} ตร.ม.<br>
      <strong>พื้นที่สุทธิที่ทา: ${netArea.toFixed(2)} ตร.ม.</strong><br><br>
      สีรองพื้น (1 รอบ): ${primerDisplay} แกลลอน<br>
      สีทับหน้า (ต่อ 1 รอบ): ${topcoatPerOneDisplay} แกลลอน<br>
      สีทับหน้ารวม (${coatCount} รอบ): ${topcoatTotalDisplay} แกลลอน
    `;

    resultWrapper.style.display = 'block';
  }

  function clearAll() {
    if (!confirm('ต้องการล้างข้อมูลทั้งหมดหรือไม่?')) return;
    walls = [];
    excludeEl.value = '';
    coatCountEl.value = '2';
    renderList();
    calculatePaint();
  }

  function addWall() {
    const w = parseFloat(widthEl.value);
    const h = parseFloat(heightEl.value);
    const type = areaTypeEl.value;

    if (!w || !h || w <= 0 || h <= 0) {
      alert('กรุณากรอกค่าที่ถูกต้อง (ค่ามากกว่า 0)');
      return;
    }

    walls.push({ type, width: w, height: h, area: w*h });
    widthEl.value = '';
    heightEl.value = '';
    widthEl.focus();

    renderList();
    calculatePaint();
  }

  // events
  areaTypeEl.addEventListener('change', () => { updateLabels(); renderList(); });
  addBtn.addEventListener('click', addWall);
  clearBtn.addEventListener('click', clearAll);
  coatCountEl.addEventListener('input', calculatePaint);
  excludeEl.addEventListener('input', calculatePaint);

  // init
  updateLabels();
  renderList();
});

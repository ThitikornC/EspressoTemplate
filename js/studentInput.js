// ระบบ Autocomplete สำหรับชื่อผู้ทดสอบ
import { 
  getAllStudents, 
  saveStudentToFirebase, 
  saveTestResult,
  getAllClassrooms 
} from './mongodb-config.js';

// สร้าง UI สำหรับกรอกข้อมูลผู้ทดสอบ
export async function showStudentInputDialog() {
  return new Promise(async (resolve) => {
    // สร้าง overlay
    const overlay = document.createElement('div');
    overlay.id = 'studentInputOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    // สร้าง dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: linear-gradient(135deg, #ffffff 0%, #f8f6f0 100%);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      border: 4px solid #74640a;
    `;

    dialog.innerHTML = `
      <h2 style="color: #74640a; margin-top: 0; font-size: 28px; text-align: center; font-family: 'Roboto', sans-serif;">
        ข้อมูลผู้ทดสอบ
      </h2>
      
      <div style="margin-bottom: 20px; position: relative;">
        <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 600; font-size: 16px;">
          ชื่อ-นามสกุล:
        </label>
        <input 
          type="text" 
          id="studentNameInput" 
          placeholder="พิมพ์ชื่อหรือเลือกจากรายการ..."
          autocomplete="off"
          style="
            width: 100%;
            padding: 14px;
            border: 3px solid #74640a;
            border-radius: 12px;
            font-size: 16px;
            font-family: 'Roboto', sans-serif;
            box-sizing: border-box;
            transition: border-color 0.3s;
          "
        >
        <div id="studentSuggestions" style="
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 3px solid #74640a;
          border-top: none;
          border-radius: 0 0 12px 12px;
          max-height: 200px;
          overflow-y: auto;
          display: none;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        "></div>
      </div>

      <div style="margin-bottom: 20px; position: relative;">
        <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 600; font-size: 16px;">
          ชั้นเรียน:
        </label>
        <input 
          type="text" 
          id="studentClassInput" 
          placeholder="เช่น ป.1/1, ป.2/2, ม.1/3..."
          autocomplete="off"
          style="
            width: 100%;
            padding: 14px;
            border: 3px solid #74640a;
            border-radius: 12px;
            font-size: 16px;
            font-family: 'Roboto', sans-serif;
            box-sizing: border-box;
            transition: border-color 0.3s;
          "
        >
        <div id="classSuggestions" style="
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 3px solid #74640a;
          border-top: none;
          border-radius: 0 0 12px 12px;
          max-height: 150px;
          overflow-y: auto;
          display: none;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        "></div>
      </div>

      <div style="display: flex; gap: 15px; margin-top: 30px;">
        <button id="confirmStudentBtn" style="
          flex: 1;
          padding: 14px;
          background: linear-gradient(180deg, #f8f6f0 0%, #fff8e8 100%);
          color: #000;
          border: 4px solid #74640a;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Roboto', sans-serif;
          transition: all 0.3s;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        ">
          เริ่มทดสอบ
        </button>
        <button id="cancelStudentBtn" style="
          flex: 1;
          padding: 14px;
          background: linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%);
          color: #333;
          border: 4px solid #999;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Roboto', sans-serif;
          transition: all 0.3s;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        ">
          ยกเลิก
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // ดึงข้อมูลจาก Firebase
    const students = await getAllStudents();
    const classrooms = await getAllClassrooms();

    const nameInput = document.getElementById('studentNameInput');
    const classInput = document.getElementById('studentClassInput');
    const nameSuggestions = document.getElementById('studentSuggestions');
    const classSuggestions = document.getElementById('classSuggestions');
    const confirmBtn = document.getElementById('confirmStudentBtn');
    const cancelBtn = document.getElementById('cancelStudentBtn');

    // Autocomplete สำหรับชื่อ
    nameInput.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase().trim();
      nameSuggestions.innerHTML = '';
      
      if (value.length > 0) {
        const matches = students.filter(s => 
          s.name && s.name.toLowerCase().includes(value)
        );
        
        if (matches.length > 0) {
          matches.forEach(student => {
            const item = document.createElement('div');
            item.style.cssText = `
              padding: 12px;
              cursor: pointer;
              transition: background 0.2s;
              border-bottom: 1px solid #eee;
            `;
            item.textContent = `${student.name}${student.classroom ? ' (' + student.classroom + ')' : ''}`;
            
            item.addEventListener('mouseenter', () => {
              item.style.background = '#f5f0e5';
            });
            item.addEventListener('mouseleave', () => {
              item.style.background = 'white';
            });
            item.addEventListener('click', () => {
              nameInput.value = student.name;
              if (student.classroom) {
                classInput.value = student.classroom;
              }
              nameSuggestions.style.display = 'none';
            });
            
            nameSuggestions.appendChild(item);
          });
          nameSuggestions.style.display = 'block';
        } else {
          nameSuggestions.style.display = 'none';
        }
      } else {
        nameSuggestions.style.display = 'none';
      }
    });

    // Autocomplete สำหรับชั้นเรียน
    classInput.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase().trim();
      classSuggestions.innerHTML = '';
      
      if (value.length > 0) {
        const matches = classrooms.filter(c => 
          c.toLowerCase().includes(value)
        );
        
        if (matches.length > 0) {
          matches.forEach(classroom => {
            const item = document.createElement('div');
            item.style.cssText = `
              padding: 12px;
              cursor: pointer;
              transition: background 0.2s;
              border-bottom: 1px solid #eee;
            `;
            item.textContent = classroom;
            
            item.addEventListener('mouseenter', () => {
              item.style.background = '#f5f0e5';
            });
            item.addEventListener('mouseleave', () => {
              item.style.background = 'white';
            });
            item.addEventListener('click', () => {
              classInput.value = classroom;
              classSuggestions.style.display = 'none';
            });
            
            classSuggestions.appendChild(item);
          });
          classSuggestions.style.display = 'block';
        } else {
          classSuggestions.style.display = 'none';
        }
      } else {
        classSuggestions.style.display = 'none';
      }
    });

    // ปิด suggestions เมื่อคลิกข้างนอก
    document.addEventListener('click', (e) => {
      if (!nameInput.contains(e.target) && !nameSuggestions.contains(e.target)) {
        nameSuggestions.style.display = 'none';
      }
      if (!classInput.contains(e.target) && !classSuggestions.contains(e.target)) {
        classSuggestions.style.display = 'none';
      }
    });

    // Focus input เมื่อเปิด dialog
    setTimeout(() => nameInput.focus(), 100);

    // ปุ่มยืนยัน
    confirmBtn.addEventListener('click', async () => {
      const studentName = nameInput.value.trim();
      const classroom = classInput.value.trim();
      
      if (!studentName) {
        alert('กรุณากรอกชื่อผู้ทดสอบ');
        nameInput.focus();
        return;
      }

      try {
        // บันทึกข้อมูลผู้ทดสอบลง Firebase
        await saveStudentToFirebase({
          name: studentName,
          classroom: classroom || '',
          lastActivity: new Date().toISOString()
        });

        document.body.removeChild(overlay);
        resolve({ name: studentName, classroom: classroom || '' });
      } catch (error) {
        console.error('Error saving student:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });

    // ปุ่มยกเลิก
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    // Enter เพื่อยืนยัน
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      }
    });
    classInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      }
    });

    // ESC เพื่อยกเลิก
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
  });
}

// บันทึกผลการทดสอบ
export async function saveStudentTestResult(studentInfo, testData) {
  try {
    const resultData = {
      studentName: studentInfo.name,
      classroom: studentInfo.classroom || '',
      activityType: testData.activityType || 'unknown',
      topic: testData.topic || '',
      score: testData.score || 0,
      totalQuestions: testData.totalQuestions || 0,
      correctAnswers: testData.correctAnswers || 0,
      timeSpent: testData.timeSpent || 0,
      timestamp: new Date().toISOString()
    };
    
    await saveTestResult(resultData);
    console.log('Test result saved:', resultData);
    return true;
  } catch (error) {
    console.error('Error saving test result:', error);
    return false;
  }
}

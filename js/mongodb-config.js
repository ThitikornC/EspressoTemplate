// MongoDB Configuration for Student Management System
// ใช้ MongoDB แทน Firebase สำหรับจัดการข้อมูลผู้ทดสอบ

const MONGODB_URI = import.meta.env?.VITE_MONGODB_URI || 'mongodb+srv://nippit62:ohm0966477158@testing.hgxbz.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB = import.meta.env?.VITE_MONGODB_DB || 'Espresso_template';

// เก็บ collections ที่ใช้งาน
let studentsCollection = null;
let testResultsCollection = null;

// ========== ระบบจัดการผู้ทดสอบ ==========

// บันทึกหรืออัปเดตข้อมูลผู้ทดสอบ
export async function saveStudentToFirebase(studentData) {
  try {
    const response = await fetch('/api/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save student data');
    }
    
    const result = await response.json();
    return result.studentId || result.id;
  } catch (error) {
    console.error('Error saving student:', error);
    throw error;
  }
}

// ดึงรายชื่อผู้ทดสอบทั้งหมด
export async function getAllStudents() {
  try {
    const response = await fetch('/api/students/all');
    
    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }
    
    const data = await response.json();
    return data.students || [];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

// ดึงข้อมูลผู้ทดสอบตามชื่อและชั้นเรียน
export async function getStudentByName(name, classroom = '') {
  try {
    const params = new URLSearchParams({ name });
    if (classroom) params.append('classroom', classroom);
    
    const response = await fetch(`/api/students/by-name?${params}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.student || null;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
}

// บันทึกผลการทดสอบของผู้ทดสอบ
export async function saveTestResult(resultData) {
  try {
    const response = await fetch('/api/test-results/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save test result');
    }
    
    const result = await response.json();
    return result.resultId || result.id;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
}

// ดึงผลการทดสอบของผู้ทดสอบ
export async function getStudentResults(studentName, classroom = '') {
  try {
    const params = new URLSearchParams({ studentName });
    if (classroom) params.append('classroom', classroom);
    
    const response = await fetch(`/api/test-results/by-student?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch test results');
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching student results:', error);
    return [];
  }
}

// ดึงรายชื่อชั้นเรียนทั้งหมด
export async function getAllClassrooms() {
  try {
    const response = await fetch('/api/students/classrooms');
    
    if (!response.ok) {
      throw new Error('Failed to fetch classrooms');
    }
    
    const data = await response.json();
    return data.classrooms || [];
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return [];
  }
}

// ========== Activity Management (เก็บไว้เพื่อความเข้ากันได้) ==========

// บันทึก activity
export async function saveActivityToFirebase(activityData) {
  try {
    const response = await fetch('/api/activities/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save activity');
    }
    
    const result = await response.json();
    return result.activityId || result.id;
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
}

// ดึง activity ทั้งหมด
export async function getAllActivities() {
  try {
    const response = await fetch('/api/activities/all');
    
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    
    const data = await response.json();
    return data.activities || [];
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

// ลบ activity
export async function deleteActivityFromFirebase(activityId) {
  try {
    const response = await fetch(`/api/activities/delete/${activityId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

// Export database reference (for compatibility)
export const db = {
  collection: (name) => ({
    add: async (data) => {
      const response = await fetch(`/api/collections/${name}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return { id: result.id };
    },
    get: async () => {
      const response = await fetch(`/api/collections/${name}/all`);
      const data = await response.json();
      return {
        docs: data.docs.map(doc => ({
          id: doc._id,
          data: () => doc
        }))
      };
    }
  })
};

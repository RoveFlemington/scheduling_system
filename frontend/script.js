// 定义API基础URL
const API_BASE_URL = 'http://localhost:5000/api';

// 全局变量，用于保存正在编辑的记录信息
let currentTeacherId = null;
let currentStudentId = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    const tabs = [...tabElements].map(tab => new bootstrap.Tab(tab));
    
    // 绑定年级变更事件，自动切换对应的时间段标签页
    document.getElementById('student-grade').addEventListener('change', function() {
        const grade = this.value;
        if (grade.startsWith('初')) {
            // 如果是初中，显示初中时间段
            const middleSchoolTab = document.getElementById('student-middle-school-tab');
            new bootstrap.Tab(middleSchoolTab).show();
        } else if (grade.startsWith('高')) {
            // 如果是高中，显示高中时间段
            const highSchoolTab = document.getElementById('student-high-school-tab');
            new bootstrap.Tab(highSchoolTab).show();
        }
    });
    
    // 加载教师和学生数据
    loadTeachers();
    loadStudents();
    
    // 添加教师表单提交事件
    document.getElementById('teacher-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // 判断是添加还是更新
        if (document.getElementById('update-teacher-btn').classList.contains('d-none')) {
            addTeacher();
        } else {
            updateTeacher();
        }
    });
    
    // 添加学生表单提交事件
    document.getElementById('student-form').addEventListener('submit', function(e) {
        e.preventDefault();
        // 判断是添加还是更新
        if (document.getElementById('update-student-btn').classList.contains('d-none')) {
            addStudent();
        } else {
            updateStudent();
        }
    });
    
    // 更新教师按钮事件
    document.getElementById('update-teacher-btn').addEventListener('click', function() {
        updateTeacher();
    });
    
    // 取消编辑教师按钮事件
    document.getElementById('cancel-teacher-edit-btn').addEventListener('click', function() {
        cancelTeacherEdit();
    });
    
    // 更新学生按钮事件
    document.getElementById('update-student-btn').addEventListener('click', function() {
        updateStudent();
    });
    
    // 取消编辑学生按钮事件
    document.getElementById('cancel-student-edit-btn').addEventListener('click', function() {
        cancelStudentEdit();
    });
    
    // 确认删除按钮事件
    document.getElementById('confirm-delete-btn').addEventListener('click', function() {
        confirmDelete();
    });
    
    // 课程类型切换事件
    document.getElementById('course-type').addEventListener('change', function() {
        // 获取选中的课程类型
        const courseType = this.value;
        // 显示或隐藏首选教师选项
        const teacherPrefContainer = document.getElementById('teacher-preference-container');
        if (courseType === '一对一') {
            teacherPrefContainer.style.display = 'block';
        } else {
            teacherPrefContainer.style.display = 'block'; // 修改为一对多也显示教师选择
        }
    });
    
    // 生成排课表按钮事件
    document.getElementById('generate-schedule').addEventListener('click', function() {
        generateSchedule();
    });
    
    // 清除所有数据按钮事件
    document.getElementById('clear-data').addEventListener('click', function() {
        clearData();
    });
});

// 加载教师数据
function loadTeachers() {
    fetch(`${API_BASE_URL}/teachers`)
        .then(response => response.json())
        .then(teachers => {
            displayTeachers(teachers);
            updateTeacherOptions(teachers);
        })
        .catch(error => showMessage(`获取教师数据失败: ${error.message}`));
}

// 加载学生数据
function loadStudents() {
    fetch(`${API_BASE_URL}/students`)
        .then(response => response.json())
        .then(students => {
            displayStudents(students);
        })
        .catch(error => showMessage(`获取学生数据失败: ${error.message}`));
}

// 显示教师列表
function displayTeachers(teachers) {
    const teachersList = document.getElementById('teachers-list');
    teachersList.innerHTML = '';
    
    if (teachers.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.className = 'text-center text-muted py-4';
        emptyCell.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>暂无教师数据';
        emptyRow.appendChild(emptyCell);
        teachersList.appendChild(emptyRow);
        return;
    }
    
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        
        // 教师姓名
        const nameCell = document.createElement('td');
        nameCell.className = 'fw-semibold';
        nameCell.textContent = teacher.name;
        row.appendChild(nameCell);
        
        // 可教授年级
        const gradesCell = document.createElement('td');
        gradesCell.textContent = teacher.grades.join(', ');
        row.appendChild(gradesCell);
        
        // 教授学科
        const subjectsCell = document.createElement('td');
        subjectsCell.textContent = teacher.subjects.join(', ');
        row.appendChild(subjectsCell);
        
        // 可用时间段
        const availabilityCell = document.createElement('td');
        // 将时间段进行缩写显示
        const shortTimeSlots = teacher.availability.map(time => {
            return time.replace('周六上午', '周六上').replace('周六下午', '周六下')
                      .replace('周日上午', '周日上').replace('周日下午', '周日下');
        });
        availabilityCell.textContent = shortTimeSlots.join(', ');
        row.appendChild(availabilityCell);
        
        // 操作列
        const actionsCell = document.createElement('td');
        actionsCell.className = 'text-center';
        
        // 编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-primary me-2';
        editBtn.innerHTML = '<i class="bi bi-pencil-square"></i>';
        editBtn.title = '编辑';
        editBtn.onclick = () => editTeacher(teacher.id);
        actionsCell.appendChild(editBtn);
        
        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = '删除';
        deleteBtn.onclick = () => showDeleteConfirm('teacher', teacher.id, teacher.name);
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        
        teachersList.appendChild(row);
    });
}

// 更新教师选项
function updateTeacherOptions(teachers) {
    const preferredTeacher = document.getElementById('preferred-teacher');
    preferredTeacher.innerHTML = '<option value="">请选择教师</option>';
    
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.name;
        option.textContent = teacher.name;
        preferredTeacher.appendChild(option);
    });
}

// 显示学生列表
function displayStudents(students) {
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
        // 如果没有学生数据，显示提示信息
        const messageRow = document.createElement('tr');
        messageRow.innerHTML = `<td colspan="7" class="text-center py-4">
            <div class="alert alert-info m-0">
                <i class="bi bi-info-circle me-2"></i>暂无学生数据
            </div>
        </td>`;
        studentsList.appendChild(messageRow);
        return;
    }
    
    // 按学生姓名分组显示
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // 缩略显示时间段，最多显示3个
        let availabilityText = student.availability.slice(0, 3).map(time => {
            // 提取时间段的日期和时间部分
            let day = time.startsWith('周六') ? '周六' : '周日';
            let timeRange = time.replace('周六', '').replace('周日', '');
            return `${day}${timeRange}`;
        }).join('<br>');
        
        if (student.availability.length > 3) {
            availabilityText += `<br>...(共${student.availability.length}个)`;
        }
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.grade}</td>
            <td>${student.subject}</td>
            <td>${student.courseType}</td>
            <td>${student.preferredTeacher || '-'}</td>
            <td><small>${availabilityText}</small></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-student" data-id="${student.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-student" data-id="${student.id}" data-name="${student.name}" data-grade="${student.grade}" data-subject="${student.subject}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        studentsList.appendChild(row);
        
        // 添加编辑和删除按钮的事件监听器
        row.querySelector('.edit-student').addEventListener('click', function() {
            const studentId = this.dataset.id;
            editStudent(studentId);
        });
        
        row.querySelector('.delete-student').addEventListener('click', function() {
            const studentId = this.dataset.id;
            const studentName = this.dataset.name;
            const studentGrade = this.dataset.grade;
            const studentSubject = this.dataset.subject;
            showDeleteConfirm('student', studentId, `${studentName} (${studentGrade} ${studentSubject})`);
        });
    });
}

// 添加教师
function addTeacher() {
    // 获取教师姓名
    const teacherName = document.getElementById('teacher-name').value.trim();
    if (!teacherName) {
        showMessage('请输入教师姓名');
        return;
    }
    
    // 获取可教授年级
    const gradeCheckboxes = document.querySelectorAll('input[id^="grade-"]');
    const selectedGrades = Array.from(gradeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedGrades.length === 0) {
        showMessage('请选择至少一个可教授年级');
        return;
    }
    
    // 获取可教授学科
    const subjectCheckboxes = document.querySelectorAll('input[id^="subject-"]');
    const selectedSubjects = Array.from(subjectCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedSubjects.length === 0) {
        showMessage('请选择至少一个可教授学科');
        return;
    }
    
    // 获取可用时间段
    let selectedTimes = [];
    // 检查是否在初中选项卡中
    if (document.getElementById('middle-school-times').classList.contains('active')) {
        // 获取初中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="teacher-time-m"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    } else {
        // 获取高中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="teacher-time-h"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    }
    
    if (selectedTimes.length === 0) {
        showMessage('请选择至少一个可用时间段');
        return;
    }
    
    // 构建教师数据
    const teacherData = {
        name: teacherName,
        grades: selectedGrades,
        subjects: selectedSubjects,
        availability: selectedTimes
    };
    
    // 发送添加教师请求
    fetch(`${API_BASE_URL}/teachers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '添加教师失败'); });
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message || '教师添加成功', 'success');
        document.getElementById('teacher-form').reset();
        loadTeachers();
    })
    .catch(error => {
        showMessage(error.message);
    });
}

// 编辑教师信息
function editTeacher(teacherId) {
    fetch(`${API_BASE_URL}/teachers`)
        .then(response => response.json())
        .then(teachers => {
            const teacher = teachers.find(t => t.id === teacherId);
            if (!teacher) {
                showMessage('未找到该教师信息');
                return;
            }
            
            // 保存当前编辑的教师ID
            currentTeacherId = teacherId;
            
            // 填充表单数据
            document.getElementById('teacher-name').value = teacher.name;
            
            // 清空所有复选框
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 选中教授年级
            teacher.grades.forEach(grade => {
                const checkbox = document.getElementById(`grade-${grade}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // 选中教授学科
            teacher.subjects.forEach(subject => {
                const checkbox = document.getElementById(`subject-${subject}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // 根据时间段格式选择正确的标签页和复选框
            // 默认先显示初中标签页
            if (teacher.availability.some(time => time.includes('10:00-12:00') || time.includes('17:00-19:00'))) {
                // 如果存在2小时的时间段，显示高中标签页
                const highSchoolTab = document.getElementById('high-school-tab');
                new bootstrap.Tab(highSchoolTab).show();
                
                // 选中高中时间段
                teacher.availability.forEach(time => {
                    const idMap = {
                        '周六上午8:00-10:00': 'teacher-time-h1',
                        '周六上午10:00-12:00': 'teacher-time-h2',
                        '周六下午13:00-15:00': 'teacher-time-h3',
                        '周六下午15:00-17:00': 'teacher-time-h4',
                        '周六下午17:00-19:00': 'teacher-time-h5',
                        '周日上午8:00-10:00': 'teacher-time-h6',
                        '周日上午10:00-12:00': 'teacher-time-h7',
                        '周日下午13:00-15:00': 'teacher-time-h8',
                        '周日下午15:00-17:00': 'teacher-time-h9',
                        '周日下午17:00-19:00': 'teacher-time-h10'
                    };
                    
                    const checkboxId = idMap[time];
                    if (checkboxId) {
                        const checkbox = document.getElementById(checkboxId);
                        if (checkbox) checkbox.checked = true;
                    }
                });
            } else {
                // 否则显示初中标签页
                const middleSchoolTab = document.getElementById('middle-school-tab');
                new bootstrap.Tab(middleSchoolTab).show();
                
                // 选中初中时间段
                teacher.availability.forEach(time => {
                    const idMap = {
                        '周六上午8:00-9:30': 'teacher-time-m1',
                        '周六上午9:30-11:00': 'teacher-time-m2',
                        '周六上午11:00-12:30': 'teacher-time-m3',
                        '周六下午13:00-14:30': 'teacher-time-m4',
                        '周六下午14:30-16:00': 'teacher-time-m5',
                        '周六下午16:00-17:30': 'teacher-time-m6',
                        '周六下午17:30-19:00': 'teacher-time-m7',
                        '周日上午8:00-9:30': 'teacher-time-m8',
                        '周日上午9:30-11:00': 'teacher-time-m9',
                        '周日上午11:00-12:30': 'teacher-time-m10',
                        '周日下午13:00-14:30': 'teacher-time-m11',
                        '周日下午14:30-16:00': 'teacher-time-m12',
                        '周日下午16:00-17:30': 'teacher-time-m13',
                        '周日下午17:30-19:00': 'teacher-time-m14'
                    };
                    
                    const checkboxId = idMap[time];
                    if (checkboxId) {
                        const checkbox = document.getElementById(checkboxId);
                        if (checkbox) checkbox.checked = true;
                    }
                });
            }
            
            // 切换按钮显示
            document.getElementById('add-teacher-btn').classList.add('d-none');
            document.getElementById('update-teacher-btn').classList.remove('d-none');
            document.getElementById('cancel-teacher-edit-btn').classList.remove('d-none');
        })
        .catch(error => {
            showMessage(`获取教师信息失败: ${error.message}`);
        });
}

// 更新教师信息
function updateTeacher() {
    if (!currentTeacherId) {
        showMessage('没有选中要编辑的教师');
        return;
    }
    
    // 获取表单数据
    const teacherName = document.getElementById('teacher-name').value.trim();
    if (!teacherName) {
        showMessage('请输入教师姓名');
        return;
    }
    
    // 获取可教授年级
    const gradeCheckboxes = document.querySelectorAll('input[id^="grade-"]');
    const selectedGrades = Array.from(gradeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedGrades.length === 0) {
        showMessage('请选择至少一个可教授年级');
        return;
    }
    
    // 获取可教授学科
    const subjectCheckboxes = document.querySelectorAll('input[id^="subject-"]');
    const selectedSubjects = Array.from(subjectCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    
    if (selectedSubjects.length === 0) {
        showMessage('请选择至少一个可教授学科');
        return;
    }
    
    // 获取可用时间段
    let selectedTimes = [];
    // 检查是否在初中选项卡中
    if (document.getElementById('middle-school-times').classList.contains('show')) {
        // 获取初中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="teacher-time-m"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    } else {
        // 获取高中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="teacher-time-h"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    }
    
    if (selectedTimes.length === 0) {
        showMessage('请选择至少一个可用时间段');
        return;
    }
    
    // 构建教师数据
    const teacherData = {
        id: currentTeacherId,
        name: teacherName,
        grades: selectedGrades,
        subjects: selectedSubjects,
        availability: selectedTimes
    };
    
    // 发送更新请求
    fetch(`${API_BASE_URL}/teachers/${currentTeacherId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '更新教师失败'); });
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message || '教师信息更新成功', 'success');
        cancelTeacherEdit();
        loadTeachers();
    })
    .catch(error => {
        showMessage(error.message);
    });
}

// 取消编辑教师
function cancelTeacherEdit() {
    currentTeacherId = null;
    document.getElementById('teacher-form').reset();
    document.getElementById('add-teacher-btn').classList.remove('d-none');
    document.getElementById('update-teacher-btn').classList.add('d-none');
    document.getElementById('cancel-teacher-edit-btn').classList.add('d-none');
}

// 显示删除确认对话框
function showDeleteConfirm(type, id, name) {
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    const confirmButton = document.getElementById('confirm-delete-btn');
    const message = document.getElementById('delete-confirm-message');
    
    // 更新确认消息
    if (type === 'teacher') {
        message.textContent = `确定要删除教师 "${name}" 吗？此操作不可恢复。`;
    } else {
        message.textContent = `确定要删除学生记录 "${name}" 吗？此操作不可恢复。`;
    }
    
    // 保存要删除的类型和ID
    confirmButton.dataset.type = type;
    confirmButton.dataset.id = id;
    
    modal.show();
}

// 确认删除
function confirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const type = confirmBtn.dataset.type;
    const id = confirmBtn.dataset.id;
    
    // 根据类型构建API路径
    const apiPath = type === 'teacher' ? `${API_BASE_URL}/teachers/${id}` : `${API_BASE_URL}/students/${id}`;
    
    fetch(apiPath, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `删除${type === 'teacher' ? '教师' : '学生'}失败`); });
        }
        return response.json();
    })
    .then(data => {
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        showMessage(data.message || `${type === 'teacher' ? '教师' : '学生'}删除成功`, 'success');
        
        // 重新加载数据
        if (type === 'teacher') {
            loadTeachers();
        } else {
            loadStudents();
        }
    })
    .catch(error => {
        showMessage(error.message);
    });
}

// 生成排课表
function generateSchedule() {
    // 禁用按钮防止重复点击
    const generateButton = document.getElementById('generate-schedule');
    generateButton.disabled = true;
    generateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>排课中...';
    
    // 发送生成排课表请求
    fetch(`${API_BASE_URL}/generate-schedule`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '排课失败'); });
        }
        return response.json();
    })
    .then(schedule => {
        displaySchedule(schedule);
        showMessage('排课成功', 'success');
        
        // 自动切换到排课结果标签页
        const scheduleTab = document.getElementById('schedule-tab');
        bootstrap.Tab.getInstance(scheduleTab).show();
    })
    .catch(error => {
        showMessage(error.message);
    })
    .finally(() => {
        // 恢复按钮状态
        generateButton.disabled = false;
        generateButton.innerHTML = '<i class="bi bi-magic me-2"></i>生成排课表';
    });
}

// 显示排课表
function displaySchedule(schedule) {
    const saturdaySchedule = document.getElementById('saturday-schedule');
    const sundaySchedule = document.getElementById('sunday-schedule');
    
    saturdaySchedule.innerHTML = '';
    sundaySchedule.innerHTML = '';
    
    // 按时间段排序
    schedule.sort((a, b) => {
        const getTimeValue = timeSlot => {
            const hour = timeSlot.match(/(\d+):00-/)[1];
            return parseInt(hour);
        };
        
        return getTimeValue(a.timeSlot) - getTimeValue(b.timeSlot);
    });
    
    // 分组为周六和周日
    const saturdaySlots = schedule.filter(slot => slot.timeSlot.startsWith('周六'));
    const sundaySlots = schedule.filter(slot => slot.timeSlot.startsWith('周日'));
    
    // 显示周六课程
    if (saturdaySlots.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.className = 'text-center text-muted py-4';
        emptyCell.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>没有周六的课程安排';
        emptyRow.appendChild(emptyCell);
        saturdaySchedule.appendChild(emptyRow);
    } else {
        saturdaySlots.forEach(slot => {
            createScheduleRow(slot, saturdaySchedule);
        });
    }
    
    // 显示周日课程
    if (sundaySlots.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.className = 'text-center text-muted py-4';
        emptyCell.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>没有周日的课程安排';
        emptyRow.appendChild(emptyCell);
        sundaySchedule.appendChild(emptyRow);
    } else {
        sundaySlots.forEach(slot => {
            createScheduleRow(slot, sundaySchedule);
        });
    }
}

// 创建排课表行
function createScheduleRow(slot, container) {
    const row = document.createElement('tr');
    
    // 添加课程类型的样式
    if (slot.courseType === '一对多') {
        row.classList.add('group-class');
    } else {
        row.classList.add('individual-class');
    }
    
    // 时间段 (只显示时间部分，不显示周几)
    const timeCell = document.createElement('td');
    const timePart = slot.timeSlot.replace('周六', '').replace('周日', '');
    timeCell.textContent = timePart;
    row.appendChild(timeCell);
    
    // 教师
    const teacherCell = document.createElement('td');
    teacherCell.className = 'fw-semibold';
    teacherCell.textContent = slot.teacher;
    row.appendChild(teacherCell);
    
    // 学生
    const studentsCell = document.createElement('td');
    if (slot.students.length > 1) {
        studentsCell.innerHTML = `<span class="badge rounded-pill bg-info">${slot.students.length}人</span> ${slot.students.join(', ')}`;
    } else {
        studentsCell.textContent = slot.students.join(', ');
    }
    row.appendChild(studentsCell);
    
    // 课程类型
    const courseTypeCell = document.createElement('td');
    if (slot.courseType === '一对一') {
        courseTypeCell.innerHTML = '<span class="badge bg-warning">一对一</span>';
    } else {
        courseTypeCell.innerHTML = '<span class="badge bg-info">一对多</span>';
    }
    row.appendChild(courseTypeCell);
    
    // 年级
    const gradeCell = document.createElement('td');
    gradeCell.textContent = slot.grade;
    row.appendChild(gradeCell);
    
    // 学科
    const subjectCell = document.createElement('td');
    subjectCell.textContent = slot.subject;
    row.appendChild(subjectCell);
    
    container.appendChild(row);
}

// 清除所有数据
function clearData() {
    if (confirm('确定要清除所有数据吗？这将删除所有教师、学生和排课信息！')) {
        // 禁用按钮防止重复点击
        const clearButton = document.getElementById('clear-data');
        clearButton.disabled = true;
        clearButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>清除中...';
        
        fetch(`${API_BASE_URL}/clear-data`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message || '数据已清除', 'success');
            loadTeachers();
            loadStudents();
            
            // 清空排课表
            document.getElementById('saturday-schedule').innerHTML = '';
            document.getElementById('sunday-schedule').innerHTML = '';
            
            // 在周六和周日排课表中显示"暂无数据"
            ['saturday-schedule', 'sunday-schedule'].forEach(id => {
                const container = document.getElementById(id);
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 5;
                emptyCell.className = 'text-center text-muted py-4';
                emptyCell.innerHTML = '<i class="bi bi-exclamation-circle me-2"></i>暂无课程安排';
                emptyRow.appendChild(emptyCell);
                container.appendChild(emptyRow);
            });
        })
        .catch(error => {
            showMessage(`清除数据失败: ${error.message}`);
        })
        .finally(() => {
            // 恢复按钮状态
            clearButton.disabled = false;
            clearButton.innerHTML = '<i class="bi bi-trash me-2"></i>清除所有数据';
        });
    }
}

// 显示消息
function showMessage(message, type = 'error') {
    // 使用Bootstrap模态框显示消息
    const modalMessage = document.getElementById('modal-message');
    modalMessage.innerHTML = '';
    
    const messageIcon = document.createElement('i');
    messageIcon.className = type === 'error' ? 'bi bi-exclamation-triangle-fill me-2 text-danger' : 'bi bi-check-circle-fill me-2 text-success';
    modalMessage.appendChild(messageIcon);
    
    const messageText = document.createElement('span');
    messageText.textContent = message;
    modalMessage.appendChild(messageText);
    
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    messageModal.show();
    
    // 同时在排课页面显示消息
    const scheduleMessage = document.getElementById('schedule-message');
    const scheduleMessageText = document.getElementById('schedule-message-text');
    scheduleMessageText.textContent = message;
    scheduleMessage.style.display = 'block';
    
    if (type === 'error') {
        scheduleMessage.className = 'alert alert-danger';
    } else {
        scheduleMessage.className = 'alert alert-success';
    }
}

// 添加学生
function addStudent() {
    // 获取表单数据
    const studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        showMessage('请输入学生姓名');
        return;
    }
    
    // 获取年级
    const studentGrade = document.getElementById('student-grade').value;
    if (!studentGrade) {
        showMessage('请选择年级');
        return;
    }
    
    // 获取学科
    const studentSubject = document.getElementById('student-subject').value;
    if (!studentSubject) {
        showMessage('请选择学科');
        return;
    }
    
    // 获取课程类型
    const courseType = document.getElementById('course-type').value;
    if (!courseType) {
        showMessage('请选择课程类型');
        return;
    }
    
    // 构建学生数据
    const studentData = {
        name: studentName,
        grade: studentGrade,
        subject: studentSubject,
        courseType: courseType
    };
    
    // 获取可用时间段
    let selectedTimes = [];
    // 检查是否在初中选项卡中
    if (document.getElementById('student-middle-school-times').classList.contains('show')) {
        // 获取初中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="student-time-m"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    } else {
        // 获取高中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="student-time-h"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    }
    
    if (selectedTimes.length === 0) {
        showMessage('请选择至少一个可用时间段');
        return;
    }
    
    studentData.availability = selectedTimes;
    
    // 无论是一对一还是一对多，都获取教师信息
    const preferredTeacher = document.getElementById('preferred-teacher').value;
    if (!preferredTeacher) {
        showMessage('请选择教师');
        return;
    }
    studentData.preferredTeacher = preferredTeacher;
    
    // 发送添加请求
    fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '添加学生失败'); });
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message || '学生添加成功', 'success');
        // 重置表单
        document.getElementById('student-form').reset();
        // 重新加载学生列表
        loadStudents();
    })
    .catch(error => {
        showMessage(error.message);
    });
}

// 编辑学生信息
function editStudent(studentId) {
    // 获取学生数据
    fetch(`${API_BASE_URL}/students`)
        .then(response => response.json())
        .then(students => {
            const student = students.find(s => s.id === studentId);
            if (!student) {
                showMessage('找不到该学生记录');
                return;
            }
            
            // 填充表单
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-grade').value = student.grade;
            document.getElementById('student-subject').value = student.subject;
            document.getElementById('course-type').value = student.courseType;
            
            // 显示首选教师选项
            const teacherPrefContainer = document.getElementById('teacher-preference-container');
            teacherPrefContainer.style.display = 'block';
            
            // 设置首选教师
            if (student.preferredTeacher) {
                document.getElementById('preferred-teacher').value = student.preferredTeacher;
            }
            
            // 设置时间选项卡
            const isHighSchool = student.grade.startsWith('高');
            if (isHighSchool) {
                document.getElementById('student-high-school-tab').click();
            } else {
                document.getElementById('student-middle-school-tab').click();
            }
            
            // 清除所有时间段选择
            document.querySelectorAll('input[id^="student-time-"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 选中学生可用时间段
            student.availability.forEach(time => {
                // 根据时间段格式找到对应的checkbox
                let prefix = isHighSchool ? 'student-time-h' : 'student-time-m';
                let checkbox;
                
                if (isHighSchool) {
                    // 高中时间段
                    if (time.includes('8:00-10:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-h1') : document.getElementById('student-time-h6');
                    } else if (time.includes('10:00-12:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-h2') : document.getElementById('student-time-h7');
                    } else if (time.includes('13:00-15:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-h3') : document.getElementById('student-time-h8');
                    } else if (time.includes('15:00-17:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-h4') : document.getElementById('student-time-h9');
                    } else if (time.includes('17:00-19:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-h5') : document.getElementById('student-time-h10');
                    }
                } else {
                    // 初中时间段
                    if (time.includes('8:00-9:30')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m1') : document.getElementById('student-time-m8');
                    } else if (time.includes('9:30-11:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m2') : document.getElementById('student-time-m9');
                    } else if (time.includes('11:00-12:30')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m3') : document.getElementById('student-time-m10');
                    } else if (time.includes('13:00-14:30')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m4') : document.getElementById('student-time-m11');
                    } else if (time.includes('14:30-16:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m5') : document.getElementById('student-time-m12');
                    } else if (time.includes('16:00-17:30')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m6') : document.getElementById('student-time-m13');
                    } else if (time.includes('17:30-19:00')) {
                        checkbox = time.includes('周六') ? document.getElementById('student-time-m7') : document.getElementById('student-time-m14');
                    }
                }
                
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // 显示更新按钮，隐藏添加按钮
            document.getElementById('add-student-btn').classList.add('d-none');
            document.getElementById('update-student-btn').classList.remove('d-none');
            document.getElementById('cancel-student-edit-btn').classList.remove('d-none');
            
            // 设置当前编辑的学生ID
            currentStudentId = studentId;
            
            // 滚动到表单
            document.getElementById('student-form').scrollIntoView({behavior: 'smooth'});
        })
        .catch(error => {
            showMessage(error.message);
        });
}

// 更新学生信息
function updateStudent() {
    if (!currentStudentId) {
        showMessage('没有选中要编辑的学生');
        return;
    }
    
    // 获取表单数据
    const studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        showMessage('请输入学生姓名');
        return;
    }
    
    // 获取年级
    const studentGrade = document.getElementById('student-grade').value;
    if (!studentGrade) {
        showMessage('请选择年级');
        return;
    }
    
    // 获取学科
    const studentSubject = document.getElementById('student-subject').value;
    if (!studentSubject) {
        showMessage('请选择学科');
        return;
    }
    
    // 获取课程类型
    const courseType = document.getElementById('course-type').value;
    if (!courseType) {
        showMessage('请选择课程类型');
        return;
    }
    
    // 构建学生数据
    const studentData = {
        id: currentStudentId,
        name: studentName,
        grade: studentGrade,
        subject: studentSubject,
        courseType: courseType
    };
    
    // 获取可用时间段
    let selectedTimes = [];
    // 检查是否在初中选项卡中
    if (document.getElementById('student-middle-school-times').classList.contains('show')) {
        // 获取初中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="student-time-m"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    } else {
        // 获取高中时间段
        const timeCheckboxes = document.querySelectorAll('input[id^="student-time-h"]:checked');
        selectedTimes = Array.from(timeCheckboxes).map(checkbox => checkbox.value);
    }
    
    if (selectedTimes.length === 0) {
        showMessage('请选择至少一个可用时间段');
        return;
    }
    
    studentData.availability = selectedTimes;
    
    // 无论是一对一还是一对多，都获取教师信息
    const preferredTeacher = document.getElementById('preferred-teacher').value;
    if (!preferredTeacher) {
        showMessage('请选择教师');
        return;
    }
    studentData.preferredTeacher = preferredTeacher;
    
    // 发送更新请求
    fetch(`${API_BASE_URL}/students/${currentStudentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '更新学生失败'); });
        }
        return response.json();
    })
    .then(data => {
        showMessage(data.message || '学生信息更新成功', 'success');
        cancelStudentEdit();
        loadStudents();
    })
    .catch(error => {
        showMessage(error.message);
    });
}

// 取消编辑学生
function cancelStudentEdit() {
    currentStudentId = null;
    document.getElementById('student-form').reset();
    document.getElementById('teacher-preference-container').style.display = 'none';
    document.getElementById('add-student-btn').classList.remove('d-none');
    document.getElementById('update-student-btn').classList.add('d-none');
    document.getElementById('cancel-student-edit-btn').classList.add('d-none');
} 
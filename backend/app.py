from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# 数据存储路径
# 这里修改为相对于backend目录的路径
current_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(current_dir, 'data')
TEACHERS_FILE = os.path.join(DATA_DIR, 'teachers.json')
STUDENTS_FILE = os.path.join(DATA_DIR, 'students.json')
SCHEDULE_FILE = os.path.join(DATA_DIR, 'schedule.json')

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 初始化数据文件
def init_data_files():
    if not os.path.exists(TEACHERS_FILE):
        with open(TEACHERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False)
    
    if not os.path.exists(STUDENTS_FILE):
        with open(STUDENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False)
    
    if not os.path.exists(SCHEDULE_FILE):
        with open(SCHEDULE_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False)

init_data_files()

# 辅助函数
def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_data(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, ensure_ascii=False, fp=f, indent=2)

# API路由
@app.route('/api/teachers', methods=['GET'])
def get_teachers():
    teachers = load_data(TEACHERS_FILE)
    return jsonify(teachers)

@app.route('/api/teachers', methods=['POST'])
def add_teacher():
    data = request.json
    teachers = load_data(TEACHERS_FILE)
    
    # 添加唯一ID
    data['id'] = str(len(teachers) + 1)
    
    # 检查教师是否已存在
    for teacher in teachers:
        if teacher['name'] == data['name']:
            return jsonify({"error": "教师已存在"}), 400
    
    teachers.append(data)
    save_data(TEACHERS_FILE, teachers)
    return jsonify({"message": "教师添加成功"}), 201

@app.route('/api/teachers/<teacher_id>', methods=['PUT'])
def update_teacher(teacher_id):
    data = request.json
    teachers = load_data(TEACHERS_FILE)
    
    # 查找教师
    for i, teacher in enumerate(teachers):
        if teacher['id'] == teacher_id:
            # 检查名称是否与其他教师重复
            for other_teacher in teachers:
                if other_teacher['id'] != teacher_id and other_teacher['name'] == data['name']:
                    return jsonify({"error": "教师名称已存在"}), 400
            
            # 更新教师信息
            teachers[i] = data
            save_data(TEACHERS_FILE, teachers)
            return jsonify({"message": "教师信息更新成功"}), 200
    
    return jsonify({"error": "找不到该教师"}), 404

@app.route('/api/teachers/<teacher_id>', methods=['DELETE'])
def delete_teacher(teacher_id):
    teachers = load_data(TEACHERS_FILE)
    students = load_data(STUDENTS_FILE)
    schedule = load_data(SCHEDULE_FILE)
    
    # 查找该教师
    teacher_to_delete = None
    for teacher in teachers:
        if teacher['id'] == teacher_id:
            teacher_to_delete = teacher
            break
    
    if not teacher_to_delete:
        return jsonify({"error": "找不到该教师"}), 404
    
    # 检查该教师是否被学生选择为首选教师
    for student in students:
        if student.get('preferredTeacher') == teacher_to_delete['name']:
            return jsonify({"error": f"无法删除，该教师已被学生 {student['name']} 选为首选教师"}), 400
    
    # 检查该教师是否已被安排课程
    for slot in schedule:
        if slot['teacher'] == teacher_to_delete['name']:
            return jsonify({"error": "无法删除，该教师已被安排课程"}), 400
    
    # 删除教师
    teachers = [t for t in teachers if t['id'] != teacher_id]
    save_data(TEACHERS_FILE, teachers)
    
    return jsonify({"message": "教师删除成功"}), 200

@app.route('/api/students', methods=['GET'])
def get_students():
    students = load_data(STUDENTS_FILE)
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    students = load_data(STUDENTS_FILE)
    
    # 添加唯一ID
    data['id'] = str(len(students) + 1)
    
    # 允许同一个学生添加不同学科的记录，只需检查学生姓名、年级、学科和课程类型的组合是否重复
    for student in students:
        if (student['name'] == data['name'] and 
            student['grade'] == data['grade'] and 
            student['subject'] == data['subject'] and
            student['courseType'] == data['courseType']):
            return jsonify({"error": f"该学生的{data['grade']}年级{data['subject']}学科{data['courseType']}课程记录已存在"}), 400
    
    students.append(data)
    save_data(STUDENTS_FILE, students)
    return jsonify({"message": "学生添加成功"}), 201

@app.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    data = request.json
    students = load_data(STUDENTS_FILE)
    
    # 查找学生
    for i, student in enumerate(students):
        if student['id'] == student_id:
            # 检查修改后的组合是否与其他记录重复
            for other_student in students:
                if (other_student['id'] != student_id and 
                    other_student['name'] == data['name'] and 
                    other_student['grade'] == data['grade'] and 
                    other_student['subject'] == data['subject'] and
                    other_student['courseType'] == data['courseType']):
                    return jsonify({"error": f"该学生的{data['grade']}年级{data['subject']}学科{data['courseType']}课程记录已存在"}), 400
            
            # 更新学生信息
            students[i] = data
            save_data(STUDENTS_FILE, students)
            return jsonify({"message": "学生信息更新成功"}), 200
    
    return jsonify({"error": "找不到该学生记录"}), 404

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    students = load_data(STUDENTS_FILE)
    schedule = load_data(SCHEDULE_FILE)
    
    # 查找该学生记录
    student_to_delete = None
    for student in students:
        if student['id'] == student_id:
            student_to_delete = student
            break
    
    if not student_to_delete:
        return jsonify({"error": "找不到该学生记录"}), 404
    
    # 检查该学生记录是否已被安排课程
    for slot in schedule:
        if student_to_delete['name'] in slot['students']:
            # 检查是否是同一学科和年级
            if slot['grade'] == student_to_delete['grade'] and slot['subject'] == student_to_delete['subject']:
                return jsonify({"error": f"无法删除，该学生的{student_to_delete['grade']}年级{student_to_delete['subject']}学科记录已被安排课程"}), 400
    
    # 删除学生记录
    students = [s for s in students if s['id'] != student_id]
    save_data(STUDENTS_FILE, students)
    
    return jsonify({"message": "学生记录删除成功"}), 200

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    schedule = load_data(SCHEDULE_FILE)
    return jsonify(schedule)

# 排课算法
def check_time_conflict(schedule, new_time_slot, teacher_name, student_name):
    for slot in schedule:
        if slot['timeSlot'] == new_time_slot:
            if slot['teacher'] == teacher_name or student_name in slot['students']:
                return True
    return False

def is_available(time_slot, availability):
    # 检查时间段是否在可用时间内
    for avail in availability:
        if time_slot in avail:
            return True
    return False

@app.route('/api/generate-schedule', methods=['POST'])
def generate_schedule():
    teachers = load_data(TEACHERS_FILE)
    students = load_data(STUDENTS_FILE)
    
    if not teachers:
        return jsonify({"error": "请先添加教师信息"}), 400
    
    if not students:
        return jsonify({"error": "请先添加学生信息"}), 400
    
    # 定义时间段 (周六和周日的时间段)
    # 初中时间段（每节课1.5小时）
    middle_school_time_slots = [
        '周六上午8:00-9:30', '周六上午9:30-11:00', '周六上午11:00-12:30',
        '周六下午13:00-14:30', '周六下午14:30-16:00', '周六下午16:00-17:30', '周六下午17:30-19:00',
        '周日上午8:00-9:30', '周日上午9:30-11:00', '周日上午11:00-12:30',
        '周日下午13:00-14:30', '周日下午14:30-16:00', '周日下午16:00-17:30', '周日下午17:30-19:00'
    ]
    
    # 高中时间段（每节课2小时）
    high_school_time_slots = [
        '周六上午8:00-10:00', '周六上午10:00-12:00',
        '周六下午13:00-15:00', '周六下午15:00-17:00', '周六下午17:00-19:00',
        '周日上午8:00-10:00', '周日上午10:00-12:00',
        '周日下午13:00-15:00', '周日下午15:00-17:00', '周日下午17:00-19:00'
    ]
    
    # 所有可用时间段
    time_slots = middle_school_time_slots + high_school_time_slots
    
    # 初始化排课表
    schedule = []
    
    # 先排一对一课程
    one_on_one_students = [s for s in students if s['courseType'] == '一对一']
    for student in one_on_one_students:
        student_assigned = False
        # 查找该学生指定的教师
        teacher = next((t for t in teachers if t['name'] == student.get('preferredTeacher')), None)
        
        if not teacher:
            return jsonify({"error": f"找不到学生 {student['name']} 选择的教师 {student.get('preferredTeacher')}"}), 400
            
        # 检查教师是否可以教授该年级
        if student['grade'] not in teacher['grades']:
            return jsonify({"error": f"教师 {teacher['name']} 不能教授 {student['grade']}"}), 400
            
        # 检查学科匹配
        if student['subject'] not in teacher['subjects']:
            return jsonify({"error": f"教师 {teacher['name']} 不能教授 {student['subject']} 学科"}), 400
        
        # 确定使用哪组时间段
        student_time_slots = high_school_time_slots if student['grade'].startswith('高') else middle_school_time_slots
        
        for time_slot in student_time_slots:
            # 检查学生和老师在此时间段是否都可用
            student_available = is_available(time_slot, student['availability'])
            teacher_available = is_available(time_slot, teacher['availability'])
            
            if student_available and teacher_available:
                # 检查该时间段是否已被占用
                if not check_time_conflict(schedule, time_slot, teacher['name'], student['name']):
                    schedule.append({
                        'timeSlot': time_slot,
                        'teacher': teacher['name'],
                        'students': [student['name']],
                        'courseType': '一对一',
                        'grade': student['grade'],
                        'subject': student['subject']
                    })
                    student_assigned = True
                    break
        
        if not student_assigned:
            # 如果无法为学生安排课程，返回错误
            return jsonify({"error": f"无法为学生 {student['name']} 安排课程，请检查时间冲突"}), 400
    
    # 按年级和学科对一对多学生分组，并优先考虑指定了教师的学生
    group_students = [s for s in students if s['courseType'] == '一对多']
    
    # 先将学生按年级和学科分组
    grade_subject_groups = {}
    for student in group_students:
        key = f"{student['grade']}-{student['subject']}"
        if key not in grade_subject_groups:
            grade_subject_groups[key] = []
        grade_subject_groups[key].append(student)
    
    # 用于跟踪已分配的学生
    assigned_students = set()
    
    # 为每个年级和学科组排课
    for key, group in grade_subject_groups.items():
        grade, subject = key.split('-')
        
        # 确定使用哪组时间段
        group_time_slots = high_school_time_slots if grade.startswith('高') else middle_school_time_slots
        
        # 先处理有指定教师的学生
        students_with_preferred_teacher = {}
        for student in group:
            if 'preferredTeacher' in student and student['preferredTeacher']:
                if student['preferredTeacher'] not in students_with_preferred_teacher:
                    students_with_preferred_teacher[student['preferredTeacher']] = []
                students_with_preferred_teacher[student['preferredTeacher']].append(student)
        
        # 为每个指定教师的学生组排课
        for teacher_name, students_list in students_with_preferred_teacher.items():
            # 查找教师
            teacher = next((t for t in teachers if t['name'] == teacher_name), None)
            if not teacher:
                return jsonify({"error": f"找不到教师 {teacher_name}"}), 400
            
            # 检查教师是否可以教授该年级和学科
            if grade not in teacher['grades']:
                return jsonify({"error": f"教师 {teacher['name']} 不能教授 {grade}"}), 400
            
            if subject not in teacher['subjects']:
                return jsonify({"error": f"教师 {teacher['name']} 不能教授 {subject} 学科"}), 400
            
            # 寻找教师和所有学生都可用的时间段
            for time_slot in group_time_slots:
                # 检查教师在此时间段是否可用
                teacher_available = is_available(time_slot, teacher['availability'])
                if not teacher_available:
                    continue
                
                # 检查教师是否在此时间段已有一对一课程
                if any(s['timeSlot'] == time_slot and s['teacher'] == teacher['name'] and s['courseType'] == '一对一' for s in schedule):
                    continue
                
                # 查找已有的该教师在该时间段的一对多课程
                existing_group_class = next((s for s in schedule 
                                           if s['timeSlot'] == time_slot 
                                           and s['teacher'] == teacher['name'] 
                                           and s['courseType'] == '一对多'
                                           and s['grade'] == grade
                                           and s['subject'] == subject), None)
                
                # 找到该时间段可用的学生
                available_students = []
                for student in students_list:
                    # 跳过已分配的学生
                    if student['name'] in assigned_students:
                        continue
                    
                    # 检查学生在此时间段是否可用
                    if is_available(time_slot, student['availability']):
                        # 检查学生在此时间段是否已有其他课程
                        if not any(s['timeSlot'] == time_slot and student['name'] in s['students'] for s in schedule):
                            available_students.append(student)
                
                # 如果有可用学生，创建或更新课程
                if available_students:
                    if existing_group_class:
                        # 将学生添加到现有课程
                        for student in available_students:
                            existing_group_class['students'].append(student['name'])
                            assigned_students.add(student['name'])
                    else:
                        # 创建新课程
                        schedule.append({
                            'timeSlot': time_slot,
                            'teacher': teacher['name'],
                            'students': [s['name'] for s in available_students],
                            'courseType': '一对多',
                            'grade': grade,
                            'subject': subject
                        })
                        # 标记这些学生为已分配
                        for student in available_students:
                            assigned_students.add(student['name'])
        
        # 处理没有指定教师或未能与指定教师匹配的学生
        remaining_students = [s for s in group if s['name'] not in assigned_students]
        if remaining_students:
            # 找出能教授该年级和学科的教师
            available_teachers = [t for t in teachers if grade in t['grades'] and subject in t['subjects']]
            
            if not available_teachers:
                return jsonify({"error": f"没有教师可以教授{grade}的{subject}学科"}), 400
            
            # 对于每个教师，尝试组织课程
            for teacher in available_teachers:
                # 查找哪些时间段对教师可用
                teacher_available_slots = [slot for slot in group_time_slots if is_available(slot, teacher['availability'])]
                
                # 检查教师每个可用时间段
                for time_slot in teacher_available_slots:
                    # 检查老师是否在此时间段已有一对一课程
                    if any(s['timeSlot'] == time_slot and s['teacher'] == teacher['name'] and s['courseType'] == '一对一' for s in schedule):
                        continue
                    
                    # 查找已有的该教师在该时间段的一对多课程
                    existing_group_class = next((s for s in schedule 
                                               if s['timeSlot'] == time_slot 
                                               and s['teacher'] == teacher['name'] 
                                               and s['courseType'] == '一对多'
                                               and s['grade'] == grade
                                               and s['subject'] == subject), None)
                    
                    # 找到该时间段可用的学生
                    available_students = []
                    for student in remaining_students:
                        # 跳过已分配的学生
                        if student['name'] in assigned_students:
                            continue
                        
                        # 检查学生在此时间段是否可用
                        if is_available(time_slot, student['availability']):
                            # 检查学生在此时间段是否已有其他课程
                            if not any(s['timeSlot'] == time_slot and student['name'] in s['students'] for s in schedule):
                                available_students.append(student)
                    
                    if available_students:
                        if existing_group_class:
                            # 如果已有该教师同时段的一对多课程，则将学生添加到现有课程中
                            for student in available_students:
                                existing_group_class['students'].append(student['name'])
                                assigned_students.add(student['name'])
                        else:
                            # 创建新的一对多课程
                            schedule.append({
                                'timeSlot': time_slot,
                                'teacher': teacher['name'],
                                'students': [s['name'] for s in available_students],
                                'courseType': '一对多',
                                'grade': grade,
                                'subject': subject
                            })
                            # 标记这些学生为已分配
                            for student in available_students:
                                assigned_students.add(student['name'])
    
    # 检查是否有未分配的一对多学生
    unassigned_students = [s['name'] for s in group_students if s['name'] not in assigned_students]
    if unassigned_students:
        return jsonify({"error": f"无法为以下学生安排课程: {', '.join(unassigned_students)}，请检查时间冲突或增加教师"}), 400
    
    # 保存生成的排课表
    save_data(SCHEDULE_FILE, schedule)
    return jsonify(schedule)

@app.route('/api/clear-data', methods=['POST'])
def clear_data():
    # 清除所有数据
    save_data(TEACHERS_FILE, [])
    save_data(STUDENTS_FILE, [])
    save_data(SCHEDULE_FILE, [])
    return jsonify({"message": "所有数据已清除"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000) 
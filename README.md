# 教学排课系统

这是一个基于Flask和Bootstrap的教学排课系统，用于解决一对一和一对多教学场景下的课程排期问题。系统能够根据学生和教师的时间约束，自动生成无冲突的课程表。

## 功能特点

- 支持一对一和一对多课程安排
- 考虑教师可教授年级和学生年级匹配
- 考虑教师和学生的时间约束
- 优先安排一对一课程
- 按年级分组安排一对多课程
- 支持同一学生添加不同学科的多条记录
- 支持对教师和学生信息的编辑和删除
- 支持一对多课程的时间共享
- 直观的用户界面，易于操作

## 系统要求

- Python 3.7或更高版本
- Flask 2.2.3
- Flask-CORS 3.0.10
- 现代浏览器（支持ES6和Fetch API）

## 安装指南

1. 克隆此仓库到本地
2. 安装依赖：

```bash
cd scheduling_system
pip install -r requirements.txt
```

## 使用方法

1. 启动后端服务：

```bash
cd scheduling_system/backend
python app.py
```

2. 打开浏览器，访问前端页面：

```
scheduling_system/frontend/index.html
```

也可以使用任何HTTP服务器托管前端页面，例如使用Python自带的HTTP服务器：

```bash
cd scheduling_system/frontend
python -m http.server 8000
```

然后访问 `http://localhost:8000`

## 使用流程

1. **教师管理**：
   - 添加教师信息，包括姓名、可教授年级、学科和可用时间段
   - 编辑或删除已添加的教师信息
   - 查看已添加的教师列表

2. **学生管理**：
   - 添加学生信息，包括姓名、年级、学科、课程类型（一对一或一对多）
   - 同一学生可添加多个不同学科的记录
   - 对于一对一课程，需选择首选教师
   - 设置学生可用的上课时间段
   - 编辑或删除已添加的学生记录
   - 查看已添加的学生列表

3. **课程安排**：
   - 点击"生成排课表"按钮，系统将自动安排课程
   - 结果将分为周六和周日两部分显示
   - 一对多课程会将同一教师、同一年级、同一学科的学生安排在同一时段
   - 若无法生成满足所有约束的排课表，系统会给出提示信息

## 数据结构

系统使用JSON文件存储数据，包括：

- `teachers.json`：存储教师信息
- `students.json`：存储学生信息
- `schedule.json`：存储生成的排课结果

数据文件保存在后端的data目录下。

## 特别说明

- **多学科支持**：同一学生可以添加多条不同学科的记录，系统会分别为每条记录安排课程。
- **记录管理**：教师和学生记录都支持编辑和删除操作。
- **记录删除限制**：如果教师或学生已经被安排课程，系统会阻止删除相关记录。
- **一对多课程共享**：选择一对多课程类型的学生，如果是同一个教师、同一年级和同一学科，系统会尽量将他们安排在同一时间段。

## 注意事项

- 添加的学生和教师信息会在浏览器关闭后保留，除非手动清除数据
- 若排课失败，请检查教师和学生的时间约束是否合理
- 一对多课程会按照年级和学科分组，同一年级同一学科的学生将尽量被安排在同一时间段

## 演示数据

系统没有默认的演示数据，需要手动添加教师和学生信息。

## 清除数据

如需清除所有数据并重新开始，可以点击"清除所有数据"按钮。 
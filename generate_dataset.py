import os
import random
import pandas as pd
import numpy as np

def generate_student_data(num_students=120, subjects=None):
    if subjects is None:
        subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English']
    
    # Pre-defined names to create realistic student profiles
    first_names = [
        'Aarav', 'Ananya', 'Amit', 'Aditi', 'Arjun', 'Bhavna', 'Chirag', 'Dev', 'Divya', 'Esha',
        'Farhan', 'Gautam', 'Geeta', 'Hari', 'Isha', 'Jay', 'Karan', 'Kavya', 'Krunal', 'Lata',
        'Manish', 'Meera', 'Neha', 'Nitin', 'Ojas', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Riya',
        'Sanjay', 'Sneha', 'Siddharth', 'Tanvi', 'Uday', 'Varun', 'Vidya', 'Yash', 'Zoya',
        'Alexander', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica', 'James', 'Emma', 'John', 'Olivia'
    ]
    
    last_names = [
        'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Joshi', 'Singh', 'Kumar', 'Shah', 'Rao',
        'Reddy', 'Nair', 'Iyer', 'Das', 'Roy', 'Choudhury', 'Sen', 'Banerjee', 'Mishra', 'Trivedi',
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'
    ]
    
    genders = ['Male', 'Female']
    
    # Generate unique students
    student_profiles = []
    for i in range(1, num_students + 1):
        student_id = f"STD2026{i:03d}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        gender = random.choice(genders)
        student_profiles.append({
            'Student_ID': student_id,
            'Name': name,
            'Gender': gender
        })
    
    data = []
    
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    for profile in student_profiles:
        # Base capability of the student (adds realistic correlation across their subjects)
        student_aptitude = np.random.normal(32, 10) # mean 32, std 10
        
        # General discipline/habits of the student
        base_attendance = np.clip(np.random.normal(74, 12), 35, 100) # mean 74%, std 12%
        base_study_hours = np.clip(np.random.normal(8, 4), 1, 25) # mean 8h, std 4h
        
        for subject in subjects:
            # Subject specific variance (Mathematics & Physics are much tougher)
            subj_factor = {
                'Mathematics': -8,        # Hardest subject, lower scores, higher fail rate
                'Physics': -4,            # Modest difficulty
                'Chemistry': 2,
                'Computer Science': 6,     # Usually higher scores
                'English': 10               # High scores, low fail rate
            }[subject]
            
            # Attendance for this subject (correlated with base attendance + minor random noise)
            attendance = np.clip(base_attendance + np.random.normal(0, 4), 30, 100)
            
            # Study hours for this subject (correlated with base study hours + minor noise)
            study_hours = np.clip(base_study_hours * (0.8 + 0.4 * np.random.random()), 0, 24)
            
            # Performance model: influenced by attendance, study hours, aptitude, and subject factor + random noise
            # Attendance effect: 0.35 points per % attendance above 40%
            attendance_effect = 0.35 * (attendance - 40) if attendance > 40 else -0.5 * (40 - attendance)
            
            # Study time effect: 1.5 points per study hour
            study_effect = 1.5 * study_hours
            
            # Combine elements
            noise = np.random.normal(0, 8)
            marks = student_aptitude + subj_factor + attendance_effect + study_effect + noise
            
            # Cap marks between 0 and 100
            marks = int(np.clip(marks, 0, 100))
            
            # Pass/Fail status (Passing marks = 40)
            status = 'Pass' if marks >= 40 else 'Fail'
            
            data.append({
                'Student_ID': profile['Student_ID'],
                'Name': profile['Name'],
                'Gender': profile['Gender'],
                'Subject': subject,
                'Attendance_Rate': round(attendance, 1),
                'Study_Hours_Per_Week': round(study_hours, 1),
                'Marks': marks,
                'Status': status
            })
            
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    print("Generating synthetic student performance dataset with realistic failure distribution...")
    df = generate_student_data(num_students=120)
    
    os.makedirs('c:/Users/Tejashri/calculator', exist_ok=True)
    
    csv_path = 'c:/Users/Tejashri/calculator/student_performance.csv'
    xlsx_path = 'c:/Users/Tejashri/calculator/student_performance.xlsx'
    
    df.to_csv(csv_path, index=False)
    print(f"Dataset saved as CSV: {csv_path}")
    
    try:
        df.to_excel(xlsx_path, index=False, sheet_name='Student_Performance')
        print(f"Dataset saved as Excel: {xlsx_path}")
    except Exception as e:
        print(f"Error saving Excel file: {e}")

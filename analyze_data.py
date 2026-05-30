import os
import json
import pandas as pd
import numpy as np

# Try to import visualization libraries, but degrade gracefully if they are missing
try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    HAS_VIZ = True
except ImportError:
    HAS_VIZ = False

def run_analysis():
    print("Starting data analysis with Pandas...")
    
    csv_path = 'c:/Users/Tejashri/calculator/student_performance.csv'
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Please run generate_dataset.py first.")
        
    df = pd.read_csv(csv_path)
    
    # ------------------ OVERALL SUMMARY STATISTICS ------------------
    total_records = len(df)
    total_students = df['Student_ID'].nunique()
    avg_marks = float(df['Marks'].mean())
    avg_attendance = float(df['Attendance_Rate'].mean())
    overall_pass_rate = float((df['Status'] == 'Pass').sum() / total_records * 100)
    
    print(f"Loaded {total_records} records for {total_students} unique students.")
    print(f"Average Attendance: {avg_attendance:.2f}% | Average Marks: {avg_marks:.2f} | Pass Rate: {overall_pass_rate:.2f}%")
    
    # ------------------ QUESTION 1: Does attendance affect marks? ------------------
    # 1. Pearson Correlation
    attendance_marks_corr = float(df['Attendance_Rate'].corr(df['Marks']))
    
    # 2. Group by Attendance Brackets
    def get_attendance_bracket(rate):
        if rate < 70:
            return '< 70% (Critical)'
        elif rate < 80:
            return '70-80% (Low)'
        elif rate < 90:
            return '80-90% (Good)'
        else:
            return '>= 90% (Excellent)'
            
    df['Attendance_Bracket'] = df['Attendance_Rate'].apply(get_attendance_bracket)
    attn_bracket_analysis = df.groupby('Attendance_Bracket').agg(
        Avg_Marks=('Marks', 'mean'),
        Pass_Rate=('Status', lambda x: (x == 'Pass').sum() / len(x) * 100),
        Student_Count=('Student_ID', 'count')
    ).round(2).reset_index()
    
    # Sort in logical order
    bracket_order = ['< 70% (Critical)', '70-80% (Low)', '80-90% (Good)', '>= 90% (Excellent)']
    attn_bracket_analysis['Attendance_Bracket'] = pd.Categorical(attn_bracket_analysis['Attendance_Bracket'], categories=bracket_order, ordered=True)
    attn_bracket_analysis = attn_bracket_analysis.sort_values('Attendance_Bracket').to_dict('records')
    
    # ------------------ QUESTION 2: Which subjects have the highest failure rate? ------------------
    subject_analysis = df.groupby('Subject').agg(
        Avg_Marks=('Marks', 'mean'),
        Fail_Count=('Status', lambda x: (x == 'Fail').sum()),
        Total_Count=('Status', 'count')
    ).reset_index()
    subject_analysis['Fail_Rate'] = round((subject_analysis['Fail_Count'] / subject_analysis['Total_Count']) * 100, 2)
    subject_analysis = subject_analysis.sort_values(by='Fail_Rate', ascending=False)
    subject_analysis_dict = subject_analysis.to_dict('records')
    
    # ------------------ QUESTION 3: Does study time improve scores? ------------------
    # 1. Pearson Correlation
    study_marks_corr = float(df['Study_Hours_Per_Week'].corr(df['Marks']))
    
    # 2. Group by Study Brackets
    def get_study_bracket(hours):
        if hours < 6:
            return 'Low (<6 hrs/wk)'
        elif hours <= 15:
            return 'Medium (6-15 hrs/wk)'
        else:
            return 'High (>15 hrs/wk)'
            
    df['Study_Bracket'] = df['Study_Hours_Per_Week'].apply(get_study_bracket)
    study_bracket_analysis = df.groupby('Study_Bracket').agg(
        Avg_Marks=('Marks', 'mean'),
        Pass_Rate=('Status', lambda x: (x == 'Pass').sum() / len(x) * 100),
        Student_Count=('Student_ID', 'count')
    ).round(2).reset_index()
    
    # Sort in logical order
    study_order = ['Low (<6 hrs/wk)', 'Medium (6-15 hrs/wk)', 'High (>15 hrs/wk)']
    study_bracket_analysis['Study_Bracket'] = pd.Categorical(study_bracket_analysis['Study_Bracket'], categories=study_order, ordered=True)
    study_bracket_analysis = study_bracket_analysis.sort_values('Study_Bracket').to_dict('records')
    
    # ------------------ SAVE JSON SUMMARY FOR WEB DASHBOARD ------------------
    summary_data = {
        'overall': {
            'total_records': total_records,
            'total_students': total_students,
            'avg_marks': round(avg_marks, 2),
            'avg_attendance': round(avg_attendance, 2),
            'overall_pass_rate': round(overall_pass_rate, 2)
        },
        'attendance_analysis': {
            'correlation': round(attendance_marks_corr, 4),
            'brackets': attn_bracket_analysis
        },
        'subject_analysis': subject_analysis_dict,
        'study_analysis': {
            'correlation': round(study_marks_corr, 4),
            'brackets': study_bracket_analysis
        }
    }
    
    summary_json_path = 'c:/Users/Tejashri/calculator/analysis_summary.json'
    with open(summary_json_path, 'w') as f:
        json.dump(summary_data, f, indent=4)
    print(f"Analysis summary exported to JSON: {summary_json_path}")
    
    # ------------------ GENERATE STATIC SEABORN/MATPLOTLIB PLOTS ------------------
    if HAS_VIZ:
        print("Generating static visualizations with Seaborn and Matplotlib...")
        viz_dir = 'c:/Users/Tejashri/calculator/visualizations'
        os.makedirs(viz_dir, exist_ok=True)
        
        # Set visualization styles
        sns.set_theme(style="whitegrid", palette="muted")
        
        # Plot 1: Attendance vs Marks with Regression Line
        plt.figure(figsize=(8, 5))
        sns.regplot(data=df, x='Attendance_Rate', y='Marks', scatter_kws={'alpha': 0.5, 'color': '#6c5ce7'}, line_kws={'color': '#ff7675'})
        plt.title('Impact of Attendance on Marks', fontsize=14, pad=15)
        plt.xlabel('Attendance Rate (%)', fontsize=12)
        plt.ylabel('Total Marks Obtained (0-100)', fontsize=12)
        plt.tight_layout()
        plt.savefig(os.path.join(viz_dir, 'attendance_vs_marks.png'), dpi=150)
        plt.close()
        
        # Plot 2: Failure Rate by Subject (Bar Plot)
        plt.figure(figsize=(8, 5))
        sns.barplot(data=subject_analysis, x='Subject', y='Fail_Rate', palette='Reds_r')
        plt.title('Student Failure Rate by Subject', fontsize=14, pad=15)
        plt.xlabel('Subject Name', fontsize=12)
        plt.ylabel('Failure Rate (%)', fontsize=12)
        plt.ylim(0, 100)
        for i, val in enumerate(subject_analysis['Fail_Rate']):
            plt.text(i, val + 2, f"{val}%", ha='center', fontweight='bold')
        plt.tight_layout()
        plt.savefig(os.path.join(viz_dir, 'failure_rate_by_subject.png'), dpi=150)
        plt.close()
        
        # Plot 3: Study Hours vs Marks
        plt.figure(figsize=(8, 5))
        sns.scatterplot(data=df, x='Study_Hours_Per_Week', y='Marks', hue='Subject', alpha=0.7, palette='deep')
        sns.regplot(data=df, x='Study_Hours_Per_Week', y='Marks', scatter=False, line_kws={'color': '#2d3436', 'linestyle': '--'})
        plt.title('Study Hours per Week vs Student Marks', fontsize=14, pad=15)
        plt.xlabel('Weekly Study Hours', fontsize=12)
        plt.ylabel('Marks Obtained', fontsize=12)
        plt.legend(title='Subject', bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig(os.path.join(viz_dir, 'study_hours_vs_marks.png'), dpi=150)
        plt.close()
        
        print(f"Visualizations saved successfully in: {viz_dir}")
    else:
        print("Matplotlib/Seaborn not installed. Skipping static chart generation.")
        print("Note: The premium interactive web dashboard will contain beautifully animated interactive charts.")

if __name__ == '__main__':
    run_analysis()

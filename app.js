/* ==========================================================================
   EduMetrics Dashboard - Client-side Analytics Engine & Interactive Charts
   ========================================================================== */

// Global State
let rawStudentData = [];
let filteredStudentData = [];
let charts = {};
let currentPage = 1;
const recordsPerPage = 10;

// Theme configuration for Chart.js
const chartThemes = {
    dark: {
        text: '#94a3b8',
        grid: 'rgba(255, 255, 255, 0.05)',
        tooltipBg: '#0f1422',
        tooltipBorder: 'rgba(255, 255, 255, 0.08)'
    },
    light: {
        text: '#475569',
        grid: 'rgba(0, 0, 0, 0.05)',
        tooltipBg: '#ffffff',
        tooltipBorder: 'rgba(0, 0, 0, 0.08)'
    }
};

let currentTheme = 'dark';

// 1. Core Mathematical Modeling (Fallback Generator in JavaScript)
// This ensures that the web dashboard works 100% instantly even if served via file:/// protocol (CORS block)
function generateFallbackData() {
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'];
    const firstNames = [
        'Aarav', 'Ananya', 'Amit', 'Aditi', 'Arjun', 'Bhavna', 'Chirag', 'Dev', 'Divya', 'Esha',
        'Farhan', 'Gautam', 'Geeta', 'Hari', 'Isha', 'Jay', 'Karan', 'Kavya', 'Krunal', 'Lata',
        'Manish', 'Meera', 'Neha', 'Nitin', 'Ojas', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Riya',
        'Sanjay', 'Sneha', 'Siddharth', 'Tanvi', 'Uday', 'Varun', 'Vidya', 'Yash', 'Zoya'
    ];
    const lastNames = [
        'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Joshi', 'Singh', 'Kumar', 'Shah', 'Rao',
        'Reddy', 'Nair', 'Iyer', 'Das', 'Roy', 'Choudhury', 'Sen', 'Banerjee', 'Mishra', 'Trivedi'
    ];
    const genders = ['Male', 'Female'];
    
    // Seeded random for consistency
    let seed = 42;
    function random() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    function randomNormal(mean, std) {
        let u1 = random();
        let u2 = random();
        let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return mean + std * z;
    }

    const data = [];
    for (let i = 1; i <= 120; i++) {
        const studentId = `STD2026${String(i).padStart(3, '0')}`;
        const name = `${firstNames[Math.floor(random() * firstNames.length)]} ${lastNames[Math.floor(random() * lastNames.length)]}`;
        const gender = genders[Math.floor(random() * genders.length)];
        
        const baseAptitude = randomNormal(32, 10);
        const baseAttendance = Math.min(Math.max(randomNormal(74, 12), 35), 100);
        const baseStudyHours = Math.min(Math.max(randomNormal(8, 4), 1), 25);
        
        subjects.forEach(subject => {
            const subjFactor = {
                'Mathematics': -8,
                'Physics': -4,
                'Chemistry': 2,
                'Computer Science': 6,
                'English': 10
            }[subject];
            
            const attendance = Math.min(Math.max(baseAttendance + randomNormal(0, 4), 30), 100);
            const studyHours = Math.min(Math.max(baseStudyHours * (0.8 + 0.4 * random()), 0), 24);
            
            let attendanceEffect = attendance > 40 ? 0.35 * (attendance - 40) : -0.5 * (40 - attendance);
            let studyEffect = 1.5 * studyHours;
            
            let noise = randomNormal(0, 8);
            let marks = Math.min(Math.max(Math.round(baseAptitude + subjFactor + attendanceEffect + studyEffect + noise), 0), 100);
            const status = marks >= 40 ? 'Pass' : 'Fail';
            
            data.append ? data.push({
                'Student_ID': studentId,
                'Name': name,
                'Gender': gender,
                'Subject': subject,
                'Attendance_Rate': parseFloat(attendance.toFixed(1)),
                'Study_Hours_Per_Week': parseFloat(studyHours.toFixed(1)),
                'Marks': marks,
                'Status': status
            }) : data.push({
                'Student_ID': studentId,
                'Name': name,
                'Gender': gender,
                'Subject': subject,
                'Attendance_Rate': parseFloat(attendance.toFixed(1)),
                'Study_Hours_Per_Week': parseFloat(studyHours.toFixed(1)),
                'Marks': marks,
                'Status': status
            });
        });
    }
    return data;
}

// 2. Data Engineering & Metrics Computations
function calculateMetrics(data) {
    if (!data || data.length === 0) return null;
    
    const totalRecords = data.length;
    const uniqueStudents = new Set(data.map(d => d.Student_ID)).size;
    const avgMarks = data.reduce((acc, d) => acc + Number(d.Marks), 0) / totalRecords;
    const avgAttendance = data.reduce((acc, d) => acc + Number(d.Attendance_Rate), 0) / totalRecords;
    const passCount = data.filter(d => d.Status === 'Pass').length;
    const passRate = (passCount / totalRecords) * 100;
    
    // Pearson Correlation (Attendance vs Marks)
    const correlationAttendance = calculatePearsonCorrelation(
        data.map(d => Number(d.Attendance_Rate)),
        data.map(d => Number(d.Marks))
    );
    
    // Pearson Correlation (Study Hours vs Marks)
    const correlationStudy = calculatePearsonCorrelation(
        data.map(d => Number(d.Study_Hours_Per_Week)),
        data.map(d => Number(d.Marks))
    );

    // Attendance Bracket Aggregations
    const brackets = {
        '< 70% (Critical)': { sum: 0, count: 0, passCount: 0 },
        '70-80% (Low)': { sum: 0, count: 0, passCount: 0 },
        '80-90% (Good)': { sum: 0, count: 0, passCount: 0 },
        '>= 90% (Excellent)': { sum: 0, count: 0, passCount: 0 }
    };
    
    data.forEach(d => {
        const rate = Number(d.Attendance_Rate);
        const marks = Number(d.Marks);
        const passed = d.Status === 'Pass';
        
        let b = '>= 90% (Excellent)';
        if (rate < 70) b = '< 70% (Critical)';
        else if (rate < 80) b = '70-80% (Low)';
        else if (rate < 90) b = '80-90% (Good)';
        
        brackets[b].sum += marks;
        brackets[b].count++;
        if (passed) brackets[b].passCount++;
    });
    
    const attendanceBrackets = Object.keys(brackets).map(k => ({
        bracket: k,
        avgMarks: brackets[k].count > 0 ? brackets[k].sum / brackets[k].count : 0,
        passRate: brackets[k].count > 0 ? (brackets[k].passCount / brackets[k].count) * 100 : 0
    }));

    // Subject failure rate and analysis
    const subjectData = {};
    data.forEach(d => {
        if (!subjectData[d.Subject]) {
            subjectData[d.Subject] = { total: 0, failed: 0, sum: 0 };
        }
        subjectData[d.Subject].total++;
        subjectData[d.Subject].sum += Number(d.Marks);
        if (d.Status === 'Fail') {
            subjectData[d.Subject].failed++;
        }
    });
    
    const subjectAnalysis = Object.keys(subjectData).map(k => ({
        subject: k,
        avgMarks: subjectData[k].sum / subjectData[k].total,
        failRate: (subjectData[k].failed / subjectData[k].total) * 100
    })).sort((a, b) => b.failRate - a.failRate);

    return {
        totalRecords,
        uniqueStudents,
        avgMarks,
        avgAttendance,
        passRate,
        correlationAttendance,
        correlationStudy,
        attendanceBrackets,
        subjectAnalysis
    };
}

function calculatePearsonCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }
    
    const num = (n * sumXY) - (sumX * sumY);
    const den = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    return den === 0 ? 0 : num / den;
}

// 3. UI Update Orchestrations
function renderMetrics(metrics) {
    if (!metrics) return;
    
    // Count Up Animations for KPIs
    animateValue("val-total-students", 0, metrics.totalRecords, 1000);
    animateValue("val-avg-marks", 0, metrics.avgMarks, 1000, "%");
    animateValue("val-avg-attendance", 0, metrics.avgAttendance, 1000, "%");
    animateValue("val-pass-rate", 0, metrics.passRate, 1000, "%");
    
    document.getElementById('val-fail-count').textContent = `${(100 - metrics.passRate).toFixed(1)}% Failure Rate`;
    
    // Correlation values
    document.getElementById('corr-attendance').textContent = `r = +${metrics.correlationAttendance.toFixed(2)}`;
    document.getElementById('corr-study').textContent = `r = +${metrics.correlationStudy.toFixed(2)}`;
    
    // Narrative highlighting
    const critBrack = metrics.attendanceBrackets.find(b => b.bracket.includes('< 70%'));
    const execBrack = metrics.attendanceBrackets.find(b => b.bracket.includes('>= 90%'));
    
    if (critBrack) document.getElementById('metric-crit-marks').textContent = `${critBrack.avgMarks.toFixed(1)}%`;
    if (execBrack) document.getElementById('metric-exec-marks').textContent = `${execBrack.avgMarks.toFixed(1)}%`;
    
    // Hardest Subject
    if (metrics.subjectAnalysis.length > 0) {
        const hardest = metrics.subjectAnalysis[0];
        document.getElementById('hardest-subject-name').textContent = hardest.subject;
        document.getElementById('fail-ranking-explanation').innerHTML = `<strong>${hardest.subject}</strong> holds the highest failure rate of <strong>${hardest.failRate.toFixed(1)}%</strong>, showing it poses the largest challenge. English proved to be the most accessible, yielding a 0% failure rate.`;
    }
}

function animateValue(id, start, end, duration, suffix = "") {
    const obj = document.getElementById(id);
    if (!obj) return;
    
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    
    // For very high stepTimes or decimal targets, use an interval
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    
    function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = end - (remaining * range);
        
        obj.textContent = value.toFixed(1) + suffix;
        
        if (now < endTime) {
            requestAnimationFrame(run);
        } else {
            obj.textContent = end.toFixed(1) + suffix;
        }
    }
    
    requestAnimationFrame(run);
}

// 4. Interactive Chart.js Implementations
function renderCharts(metrics) {
    const theme = chartThemes[currentTheme];
    
    // Chart 1: Attendance Bracket Chart (Grouped Bar Chart)
    const ctxAttendance = document.getElementById('chart-attendance-bracket').getContext('2d');
    if (charts.attendance) charts.attendance.destroy();
    
    charts.attendance = new Chart(ctxAttendance, {
        type: 'bar',
        data: {
            labels: metrics.attendanceBrackets.map(b => b.bracket),
            datasets: [
                {
                    label: 'Avg Marks (%)',
                    data: metrics.attendanceBrackets.map(b => b.avgMarks),
                    backgroundColor: 'rgba(99, 102, 241, 0.75)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Pass Rate (%)',
                    data: metrics.attendanceBrackets.map(b => b.passRate),
                    backgroundColor: 'rgba(6, 182, 212, 0.45)',
                    borderColor: 'rgb(6, 182, 212)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: theme.text, font: { family: 'Plus Jakarta Sans', weight: 600 } }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBg,
                    titleColor: '#ffffff',
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.text, font: { family: 'Plus Jakarta Sans' } }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: theme.grid },
                    ticks: { color: theme.text },
                    title: { display: true, text: 'Marks (%)', color: theme.text }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: theme.text },
                    title: { display: true, text: 'Pass Rate (%)', color: theme.text }
                }
            }
        }
    });

    // Chart 2: Subject Failure Rates
    const ctxSubject = document.getElementById('chart-subject-fail').getContext('2d');
    if (charts.subject) charts.subject.destroy();
    
    charts.subject = new Chart(ctxSubject, {
        type: 'bar',
        data: {
            labels: metrics.subjectAnalysis.map(s => s.subject),
            datasets: [{
                label: 'Failure Rate (%)',
                data: metrics.subjectAnalysis.map(s => s.failRate),
                backgroundColor: metrics.subjectAnalysis.map((s, i) => 
                    i === 0 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(236, 72, 153, 0.45)'
                ),
                borderColor: metrics.subjectAnalysis.map((s, i) => 
                    i === 0 ? '#f43f5e' : '#ec4899'
                ),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: theme.tooltipBg,
                    titleColor: '#ffffff',
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.text },
                    title: { display: true, text: 'Failure Percentage (%)', color: theme.text }
                },
                y: {
                    grid: { color: 'transparent' },
                    ticks: { color: theme.text, font: { family: 'Plus Jakarta Sans', weight: 600 } }
                }
            }
        }
    });

    // Chart 3: Study Hours Scatter Plot
    const ctxStudy = document.getElementById('chart-study-scatter').getContext('2d');
    if (charts.study) charts.study.destroy();
    
    // Group raw data into scatter coordinates
    const scatterData = rawStudentData.map(d => ({
        x: Number(d.Study_Hours_Per_Week),
        y: Number(d.Marks),
        status: d.Status,
        name: d.Name,
        subj: d.Subject
    }));
    
    // Let's color-code based on status: Green for Pass, Red for Fail
    const passPoints = scatterData.filter(pt => pt.status === 'Pass');
    const failPoints = scatterData.filter(pt => pt.status === 'Fail');

    charts.study = new Chart(ctxStudy, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Passing Student',
                    data: passPoints,
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Failing Student',
                    data: failPoints,
                    backgroundColor: 'rgba(244, 63, 94, 0.65)',
                    borderColor: '#f43f5e',
                    borderWidth: 1,
                    pointRadius: 5.5,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: theme.text, font: { family: 'Plus Jakarta Sans', weight: 600 } }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBg,
                    titleColor: '#ffffff',
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const pt = context.raw;
                            return `${pt.name} (${pt.subj}): ${pt.x} hrs study | ${pt.y}% Score`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.text },
                    title: { display: true, text: 'Weekly Study Hours', color: theme.text }
                },
                y: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.text },
                    title: { display: true, text: 'Exam Marks (%)', color: theme.text }
                }
            }
        }
    });
}

// 5. Interactive Table & Filtering Engine
function handleFiltering() {
    const searchQuery = document.getElementById('student-search').value.toLowerCase().trim();
    const filterSubject = document.getElementById('filter-subject').value;
    const filterStatus = document.getElementById('filter-status').value;
    
    filteredStudentData = rawStudentData.filter(d => {
        const matchesSearch = d.Name.toLowerCase().includes(searchQuery) || d.Student_ID.toLowerCase().includes(searchQuery);
        const matchesSubject = filterSubject === 'all' || d.Subject === filterSubject;
        const matchesStatus = filterStatus === 'all' || d.Status === filterStatus;
        
        return matchesSearch && matchesSubject && matchesStatus;
    });
    
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tableBody = document.getElementById('table-body');
    const paginationDetails = document.getElementById('pagination-details');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    tableBody.innerHTML = '';
    
    const totalRecords = filteredStudentData.length;
    
    if (totalRecords === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching records found.</td></tr>`;
        paginationDetails.textContent = `Showing 0 to 0 of 0 records`;
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
    }
    
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
    
    const pageRecords = filteredStudentData.slice(startIndex, endIndex);
    
    pageRecords.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600; color: var(--primary);">${d.Student_ID}</td>
            <td>${d.Name}</td>
            <td>${d.Gender}</td>
            <td>${d.Subject}</td>
            <td>${d.Attendance_Rate}%</td>
            <td>${d.Study_Hours_Per_Week} hrs</td>
            <td style="font-weight: 700;">${d.Marks}%</td>
            <td><span class="status-pill ${d.Status.toLowerCase()}">${d.Status}</span></td>
        `;
        tableBody.appendChild(tr);
    });
    
    paginationDetails.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} records`;
    
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = endIndex >= totalRecords;
}

// 6. CSV Parse & Dynamic Pipeline Update
function processCustomCSV(csvText) {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            const data = results.data;
            
            // Validate basic schema
            if (data.length === 0 || !data[0].hasOwnProperty('Student_ID') || !data[0].hasOwnProperty('Marks')) {
                showToast("Invalid CSV schema! Please provide a matching Student Performance CSV.", true);
                return;
            }
            
            rawStudentData = data;
            filteredStudentData = [...rawStudentData];
            
            // Re-execute calculations & dashboard re-render
            const newMetrics = calculateMetrics(rawStudentData);
            renderMetrics(newMetrics);
            renderCharts(newMetrics);
            renderTable();
            
            showToast("Successfully loaded and parsed dynamic spreadsheet database!");
        },
        error: function(err) {
            showToast("Error parsing uploaded CSV!", true);
        }
    });
}

// 7. Theme Control & Dynamic Styling
function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('btn-theme-toggle');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        currentTheme = 'dark';
        themeBtn.innerHTML = `<i class="fa-solid fa-moon"></i> Theme`;
    } else {
        body.classList.add('light-theme');
        currentTheme = 'light';
        themeBtn.innerHTML = `<i class="fa-solid fa-sun"></i> Theme`;
    }
    
    // Re-render charts with updated theme colors
    const metrics = calculateMetrics(rawStudentData);
    renderCharts(metrics);
}

// Helper: Toast notifications
function showToast(message, isError = false) {
    const toast = document.getElementById('toast-message');
    const toastText = document.getElementById('toast-text');
    
    toastText.textContent = message;
    
    if (isError) {
        toast.style.background = "linear-gradient(135deg, var(--accent-red), #e11d48)";
        toast.querySelector('i').className = "fa-solid fa-circle-xmark";
    } else {
        toast.style.background = "linear-gradient(135deg, var(--secondary), #0d9488)";
        toast.querySelector('i').className = "fa-solid fa-circle-check";
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 8. Bootstrap & Event Bindings
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize default fallback dataset
    rawStudentData = generateFallbackData();
    filteredStudentData = [...rawStudentData];
    
    // Try fetching the raw CSV dataset from server to see if available (without CORS block)
    fetch('student_performance.csv')
        .then(response => {
            if (!response.ok) throw new Error("CORS or File Not Found");
            return response.text();
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    rawStudentData = results.data;
                    filteredStudentData = [...rawStudentData];
                    bootstrapDashboard();
                }
            });
        })
        .catch(err => {
            console.log("Serving offline / local fallback student dataset due to CORS sandbox limits.");
            bootstrapDashboard();
        });

    function bootstrapDashboard() {
        const metrics = calculateMetrics(rawStudentData);
        renderMetrics(metrics);
        renderCharts(metrics);
        renderTable();
    }

    // Interactive Table Event Listeners
    document.getElementById('student-search').addEventListener('input', handleFiltering);
    document.getElementById('filter-subject').addEventListener('change', handleFiltering);
    document.getElementById('filter-status').addEventListener('change', handleFiltering);
    
    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    document.getElementById('btn-next').addEventListener('click', () => {
        const totalRecords = filteredStudentData.length;
        if (currentPage * recordsPerPage < totalRecords) {
            currentPage++;
            renderTable();
        }
    });

    // Theme Toggle
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

    // CSV File Uploader Integration
    const dropArea = document.getElementById('csv-drop-area');
    const fileInput = document.getElementById('csv-file-input');
    
    dropArea.addEventListener('click', () => fileInput.click());
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (event) => processCustomCSV(event.target.result);
            reader.readAsText(file);
        } else {
            showToast("Unsupported file! Please upload a valid CSV database file.", true);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (event) => processCustomCSV(event.target.result);
            reader.readAsText(file);
        }
    });

    // Reload Original Demo Data
    document.getElementById('btn-load-demo').addEventListener('click', () => {
        rawStudentData = generateFallbackData();
        filteredStudentData = [...rawStudentData];
        bootstrapDashboard();
        showToast("Demo Student dataset re-initialized successfully!");
    });

    // Social Sharing Tabs Switcher
    const tabLinkedin = document.getElementById('tab-linkedin');
    const tabGithub = document.getElementById('tab-github');
    const contentLinkedin = document.getElementById('linkedin-tab-content');
    const contentGithub = document.getElementById('github-tab-content');

    tabLinkedin.addEventListener('click', () => {
        tabLinkedin.classList.add('active');
        tabGithub.classList.remove('active');
        contentLinkedin.classList.remove('hidden');
        contentGithub.classList.add('hidden');
    });

    tabGithub.addEventListener('click', () => {
        tabGithub.classList.add('active');
        tabLinkedin.classList.remove('active');
        contentGithub.classList.remove('hidden');
        contentLinkedin.classList.add('hidden');
    });

    // Clipboard Copy Managers
    document.getElementById('btn-copy-linkedin').addEventListener('click', () => {
        const text = document.getElementById('linkedin-text').textContent;
        navigator.clipboard.writeText(text.trim()).then(() => {
            showToast("LinkedIn post template copied to clipboard!");
        });
    });

    document.getElementById('btn-copy-github').addEventListener('click', () => {
        const text = document.getElementById('github-markdown').textContent;
        navigator.clipboard.writeText(text.trim()).then(() => {
            showToast("GitHub Markdown badges copied to clipboard!");
        });
    });
});

export const PROGRAMS = [
  { key: "daycare",    label: "Daycare / Pre-School" },
  { key: "kinder",     label: "Kindergarten" },
  { key: "elementary", label: "Elementary School" },
  { key: "jhs",        label: "Junior High School" },
  { key: "shs",        label: "Senior High School" },
  { key: "college",    label: "College / University" },
]

export const COLLEGE_COURSES = [
  { code: "BSIT",      name: "BS Information Technology" },
  { code: "BSBA",      name: "BS Business Administration" },
  { code: "BSED",      name: "Bachelor of Secondary Education" },
  { code: "BSA",       name: "BS Accountancy" },
  { code: "BSCS",      name: "BS Computer Science" },
  { code: "BSHM",      name: "BS Hospitality Management" },
  { code: "BSCRIM",    name: "BS Criminology" },
  { code: "BSTM",      name: "BS Tourism Management" },
  { code: "BSED-ENG",  name: "BSED – English Major" },
  { code: "BSED-MATH", name: "BSED – Mathematics Major" },
  { code: "BSED-SCI",  name: "BSED – Science Major" },
  { code: "BSED-SS",   name: "BSED – Social Studies Major" },
  { code: "BSED-FIL",  name: "BSED – Filipino Major" },
  { code: "BSED-TLE",  name: "BSED – TLE Major" },
]

export const SHS_STRANDS = [
  "ABM", "STEM", "HUMSS", "GAS", "ICT", "HE", "IA",
  "Agri-Fishery", "Sports", "Arts and Design",
]

export const LEVEL_DEFS: Record<string, string[]> = {
  daycare:    ["Daycare 1", "Daycare 2"],
  kinder:     ["Kinder 1", "Kinder 2"],
  elementary: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"],
  jhs:        ["Grade 7","Grade 8","Grade 9","Grade 10"],
}

export const LEVEL_SUBJECTS: Record<string, string[]> = {
  "Daycare 1":  ["Language and Literacy","Cognitive and Numeracy Skills","Physical Development, Health, and Safety","Social and Emotional Development","Creative Arts and Music","Understanding the World / Discovery"],
  "Daycare 2":  ["Language and Literacy","Cognitive and Numeracy Skills","Physical Development, Health, and Safety","Social and Emotional Development","Creative Arts and Music","Understanding the World / Discovery"],
  "Kinder 1":   ["Language, Literacy, and Communication","Mathematical Thinking","Physical Development, Health, and Safety","Social and Emotional Development / Values Formation","Creative Arts","Understanding the World / Discovery"],
  "Kinder 2":   ["Language, Literacy, and Communication","Mathematical Thinking","Physical Development, Health, and Safety","Social and Emotional Development / Values Formation","Creative Arts","Understanding the World / Discovery"],
  "Grade 1":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 2":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 3":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 4":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 5":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 6":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)"],
  "Grade 7":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 8":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 9":    ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
  "Grade 10":   ["English","Mathematics","Science","Filipino","Araling Panlipunan","MAPEH","Edukasyon sa Pagpapakatao (ESP)","TLE"],
}

export const SHS_STRAND_SUBJECTS: Record<string, string[]> = {
  ABM:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Fundamentals of Accounting","Business Math","Fundamentals of Economics","Principles of Management","Entrepreneurship","Organization and Management","Business Finance","Business Ethics","Applied Economics","Strategic Business Planning"],
  STEM:  ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","General Biology","General Chemistry","General Physics","Earth and Life Science","Calculus and Analytical Geometry","Advanced Physics","Organic Chemistry","Research in Science","Engineering and Technology Applications","Applied Mathematics"],
  HUMSS: ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Philosophy","Understanding Culture and Society","Creative Writing","Philippine Politics and Governance","Psychology","Social Research and Statistics","World History and Globalization","Philosophy of Human Person","Economics for Social Sciences","Applied Social Sciences / Ethics in Society"],
  GAS:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Humanities","Introduction to Social Sciences","Fundamentals of Business and Management","Basic Principles of Science and Technology","Creative Writing","Introduction to Philosophy","Research Methods / Applied Research","Economics / Business Economics","Social Issues and Ethics","Interdisciplinary Elective"],
  ICT:   ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Computer Programming 1","Introduction to Computing","Web Development 1 (HTML, CSS)","Computer Programming 2","Web Development 2 (JavaScript)","Database Management Systems","Systems Analysis and Design","Mobile Application Development","Computer Networks and Security","Capstone Project","ICT Project Management","Emerging Technologies in ICT"],
  HE:    ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Home Economics","Cookery / Culinary Basics","Bread and Pastry Production","Food and Beverage Services","Housekeeping","Caregiving (Basic)","Dressmaking / Tailoring","Advanced Cookery / International Cuisine","Events Management Services","Entrepreneurship in Home Economics","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  IA:    ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Industrial Arts","Basic Electrical Installation and Maintenance","Carpentry Fundamentals","Shielded Metal Arc Welding (SMAW) NC I","Plumbing Basics","Automotive Servicing NC I","Electrical Installation and Maintenance NC II","Shielded Metal Arc Welding (SMAW) NC II","Advanced Carpentry / Construction Technology","Industrial Safety and Maintenance","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  "Agri-Fishery": ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Agri-Fishery Arts","Crop Production (Basic)","Animal Production (Basic)","Aquaculture (Basic)","Horticulture","Agricultural Machinery and Tools","Crop Production NC II","Animal Production NC II","Aquaculture NC II","Farm Management","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  Sports: ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Sports Science","Physical Fitness and Conditioning","Fundamentals of Coaching","Sports Officiating and Rules","Sports Psychology","Safety and First Aid in Sports","Advanced Coaching and Training Techniques","Sports Event Management","Anatomy and Physiology for Athletes","Sports Analytics and Performance Analysis","Work Immersion (OJT)","Capstone Project / Practical Assessment"],
  "Arts and Design": ["Oral Communication","Reading and Writing Skills","Mathematics in the Modern World","Understanding the Self","Contemporary World","Readings in Philippine History","Physical Education / Health","Life and Works of Jose Rizal","National Service Training Program (NSTP)","Art Appreciation","Introduction to Arts and Design","Elements and Principles of Design","Creative Industries I (Applied Arts)","Creative Industries II (Media Arts)","Fundamentals of Performing Arts","Visual Arts Production","Specialization in Arts","Portfolio Development","Arts Production and Management","Contemporary Arts Practices","Work Immersion (OJT)","Capstone Project / Culminating Exhibit"],
}

export const COURSE_SUBJECTS: Record<string, string[]> = {
  BSIT:        ["Introduction to Computing","Computer Programming 1","Computer Programming 2","Data Structures and Algorithms","Database Management Systems","Web Systems and Technologies","Software Engineering","Human-Computer Interaction","Operating Systems","Computer Networks","Information Assurance and Security","Systems Analysis and Design","IT Project Management","Capstone Project / Thesis"],
  BSBA:        ["Principles of Management","Microeconomics","Macroeconomics","Business Statistics","Principles of Marketing","Financial Management","Business Law","Human Resource Management","Operations Management","Business Ethics","Organizational Behavior","Strategic Management","International Business","Entrepreneurial Management","Business Research","Project Management"],
  BSA:         ["Fundamentals of Accounting","Financial Accounting and Reporting I","Business Law","Management Accounting","Regulatory Framework and Legal Issues in Business","Cost Accounting","Accounting Information Systems","Auditing Theory","Advanced Financial Accounting and Reporting","Financial Management","Auditing and Assurance Services","Taxation (Income Tax, Business Tax)","Strategic Cost Management","Governance, Business Ethics, Risk Management, and Internal Control","Accounting Research","Integrated Review Courses (Board Exam Preparation)"],
  BSCS:        ["Introduction to Computing","Computer Programming 1","Computer Programming 2","Discrete Mathematics","Object-Oriented Programming","Computer Architecture","Data Structures and Algorithms","Database Systems","Algorithms and Complexity","Automata Theory","Operating Systems","Numerical Methods","Programming Languages","Software Engineering","Computer Networks","Human-Computer Interaction","Artificial Intelligence","Machine Learning","CS Thesis / Capstone Project"],
  BSHM:        ["Introduction to Hospitality Industry","Food and Beverage Service Operations","Housekeeping Operations","Front Office Operations","Culinary Arts / Basic Cooking","Hospitality Marketing","Hospitality Financial Management","Food Safety and Sanitation","Hospitality Law","Customer Service Management","Tourism Planning and Development","Hotel and Restaurant Management","Beverage Management (Bar and Drinks)","Event Management","Banquet and Catering Management","Entrepreneurship in Hospitality","Internship / OJT"],
  BSCRIM:      ["Introduction to Criminology","Criminal Law","Criminological Theories","Law Enforcement Administration","Ethics and Moral Values in Law Enforcement","Criminalistics / Forensic Science","Crime Detection and Investigation","Juvenile Delinquency","Police Administration","Criminal Psychology","Correctional Administration","Disaster and Risk Management","Research in Criminology","Criminal Investigation Practicum","Community Policing and Public Safety"],
  BSTM:        ["Principles of Tourism","Tourism Research and Statistics","Tourism Planning and Development","Travel Agency Operations","Tour Guiding and Tour Operations","Hospitality and Tourism Law","Tourism Marketing and Promotion","Event and Convention Management","Sustainable Tourism","Cultural and Heritage Tourism","Tourism Policy and Governance","Airline and Cruise Management","Tourism Entrepreneurship","Internship / OJT"],
  BSED:        ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-ENG":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-MATH": ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SCI":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-SS":   ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-FIL":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
  "BSED-TLE":  ["The Teaching Profession","Foundations of Education","Child and Adolescent Development","Principles of Teaching","Facilitating Learner-Centered Teaching","Educational Technology","Assessment of Learning 1","Assessment of Learning 2","Curriculum Development","Field Study (Practice Teaching Preparation)","Practice Teaching / Internship"],
}
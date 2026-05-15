ticket 1:

- Improve the email extension.
  in organization page, when setting the email extension ask "Are u sure"
  if the email extension is unique a nd check by the backend, then save
- email extension can be change only if there's no account created such as students and educators.

- In students page and educator page. when creating account, the email extension is updated into having additional extension. such as for example the base email extension is "@cmi.com" now when creating student it wil ladd .student and in educator is .educator.

resulting to : student1@cmi.student.com, educator1@cmi.educator.com

this keeps the uniqueness of the account even tho in the same org. eliminate the issue where both educator and student have same email. i mean the backend already validates unique, just to avoid it.

ticket 2:
The subjects in the creation of class in class page does't work. and also it bad that it's fetching all subject from all the school years, even tho i only need from specific school year. i notice it. so need database changes to efficient it and also make it working

here backend response
{
"success": true,
"data": [
{
"id": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"title": "Mathematics in the Modern World",
"subjectType": "minor",
"programId": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"programName": null,
"programType": null,
"realProgramId": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"levelId": null,
"levelName": null,
"courseId": null,
"strandId": null,
"lockStatus": "unlocked",
"yearLevel": "1st Year",
"termLabel": "1st Semester",
"prerequisites": [],
"prereqFor": [],
"sharings": [
{
"id": "b2b446ac-ba5d-52fa-b012-a6d113146b51",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "5876aba7-c71f-596d-85c8-7837ee4075a2",
"courseName": "BS Information Technology",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "2873ea6f-7bd3-51dc-89a9-3cc6a0bc8bf1",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "fea1e162-900a-59f4-a06d-4f8d478bb0d2",
"courseName": "BS Business Administration",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "f6049f99-fe9d-5f5e-8070-e554813b311a",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "8c530b3f-0bed-5110-a554-fd5b9b33b085",
"courseName": "Bachelor of Secondary Education",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "c09886bb-9399-5bd8-b7d3-b0ca236324e9",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "0312a0f8-9477-567c-a3b0-8a350001796f",
"courseName": "BS Accountancy",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "fa589768-4445-5f9f-b694-bad2d52dbf18",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "1ed9fd62-4c77-5b57-bf53-bf97bda3e9d6",
"courseName": "BS Computer Science",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "7e00b2fd-e528-541f-9622-009735950107",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "f17816ee-9942-5cb5-a80b-7599d6a84781",
"courseName": "BS Hospitality Management",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "461490f9-8478-558e-b7d2-af49be310e65",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "4503698c-e64e-5ed5-9b5b-3fe207b26ef2",
"courseName": "BS Criminology",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "bc091a6c-8bdc-5461-996b-5b74224f82a7",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "771e6b14-abed-513e-aa8c-7c98a29450c4",
"courseName": "BS Tourism Management",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "ca8b8357-9bc6-52f3-b18e-98847c3811a0",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "b0c1719b-fdaa-5a96-a27d-b948b845d351",
"courseName": "BSED – English Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "bd82375b-7a2a-5d09-9d9b-995d754367b4",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "6a644275-c84f-5166-ae46-93851caf79fa",
"courseName": "BSED – Mathematics Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "41cc0d5b-83d7-589b-bb4b-33a79434ab66",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "5e725b50-4479-58ed-ad24-1c2763085585",
"courseName": "BSED – Science Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "0ed96be6-5cc9-5138-aa8b-92c1fecd77b8",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "01161aad-b15b-53a1-bbce-f3d2ad921191",
"courseName": "BSED – Social Studies Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "d132a573-c68e-561f-b2d3-7ffbc3b4d1f2",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "0db9dedb-b479-5caf-a950-650afadf76f5",
"courseName": "BSED – Filipino Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "ea789995-cc6c-540c-b77a-e32b1e5e84f2",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "cf83c9e9-cffb-5bb5-9eef-c103956b193c",
"courseName": "BSED – TLE Major",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{
"id": "59bdbc4c-ce90-5be0-97d5-44b5255f19c9",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "02a0d3a4-02bc-5880-9a98-0bc3d064e547",
"courseId": "0f1dfe12-ccd0-5251-ae65-e1a437f81daa",
"courseName": "BS Information Technology",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
}
],
"createdAt": null,
"updatedAt": null
},
{
"id": "95dbbef9-78ac-59fa-9c36-2ed2de65dfcb",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"title": "Physical Education 1",
"subjectType": "minor",
"programId": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"programName": null,
"programType": null,
"realProgramId": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"levelId": null,
"levelName": null,
"courseId": null,
"strandId": null,
"lockStatus": "unlocked",
"yearLevel": "1st Year",
"termLabel": "1st Semester",
"prerequisites": [],
"prereqFor": [],
"sharings": [
{
"id": "8be6e18a-4ba6-557e-9f75-dc0bfd20e92a",
"orgId": "e5d75c8e-8c90-4536-8350-952e4f5685f9",
"subjectId": "95dbbef9-78ac-59fa-9c36-2ed2de65dfcb",
"courseId": "5876aba7-c71f-596d-85c8-7837ee4075a2",
"courseName": "BS Information Technology",
"strandId": null,
"strandName": null,
"levelId": null,
"levelName": null
},
{

Titket 3:
Creating of class is still saying set semester templat efirst even tho this proggram i seect to create class already have semester template.

{
requestId: undefined,
method: 'GET',
url: '/subjects?levelId=63d3c9b8-3ca6-54ae-9b35-6ce4c75ea09d&courseId=0312a0f8-9477-567c-a3b0-8a350001796f',
responseTime: '15ms'
}
[DEBUG] Subject: {
"id": "57ab14ce-3906-5cba-9f81-7804909f3308",
"name": "Fundamentals of Accounting",
"program_id": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"course_id": "0312a0f8-9477-567c-a3b0-8a350001796f",
"strand_id": null,
"level_id": "63d3c9b8-3ca6-54ae-9b35-6ce4c75ea09d"
}
[DEBUG] Sharings: []
BadRequestException: No semesters found for this school year. Please create semesters in Semester Settings first.
at ClassService.resolveSemesterId (C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\backend\src\modules\class\class.service.ts:158:11)
at async ClassService.create (C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\backend\src\modules\class\class.service.ts:195:22) {
response: {
message: 'No semesters found for this school year. Please create semesters in Semester Settings first.',
error: 'Bad Request',
statusCode: 400
},
status: 400,
options: {}
}
[DEBUG] Subject: {
"id": "57ab14ce-3906-5cba-9f81-7804909f3308",
"name": "Fundamentals of Accounting",
"program_id": "1e70e31c-9946-59f1-b259-fe5be63fc5d6",
"course_id": "0312a0f8-9477-567c-a3b0-8a350001796f",
"strand_id": null,
"level_id": "63d3c9b8-3ca6-54ae-9b35-6ce4c75ea09d"
}
[DEBUG] Sharings: []
BadRequestException: No semesters found for this school year. Please create semesters in Semester Settings first.
at ClassService.resolveSemesterId (C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\backend\src\modules\class\class.service.ts:158:11)
at async ClassService.create (C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV3\backend\src\modules\class\class.service.ts:195:22) {
response: {
message: 'No semesters found for this school year. Please create semesters in Semester Settings first.',
error: 'Bad Request',
statusCode: 400
},
status: 400,
options: {}
}

herer semester settings i set and its sucessfuly

College
College / University
56f9e26d-c6d9-59d8-a865-78ce3cdb12bc
College Semester Template
1st Semester

Midterm
May 15, 2026 → Jul 29, 2026
Finals
Jul 30, 2026 → Oct 13, 2026
2nd Semester

Midterm
Oct 14, 2026 → Dec 28, 2026
Finals
Dec 29, 2026 → Mar 15, 2027

HEre backend log
{
requestId: undefined,
method: 'GET',
url: '/semester-templates/assignments/by-school-year?schoolYearId=09928a9f-02ea-4143-8faf-e908fbd6a1bd',
responseTime: '11ms'
}

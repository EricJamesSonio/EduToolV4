System Details:

Admin details:
Email: eric@first.com
Password:   eric1_pass
Status: Active , Blocked , Inactive

Admin accounts
1. eric@first.com       eric1_pass
2. eric2@second.com     eric2_pass
3. eric3@third.com      eric3_pass

Base seeded organization gmail extension is "@testing.com" for org of Admin 1 "eric@first.com"
- since the org should have a base for that so it's easy to create accounts and no mistakes like typo for that.

Students accounts for Admin account 1 "eric@first.com"
1. stud1@testing.com    stud1_pass
2. stud2@testing.com    stud2_pass (do this increment up to 50 students)
50 seeded students.

Educators account for Admin account 1 "eric@first.com"
1. edu1@testing.com     edu1_pass
2. edu2@testing.com     edu2_pass (do this increment up to 10 educators)

Educator details:
Last name : 
Middle name : 
First name : 
Handled Course : BSCS
Handled subjects : (based on class assigned educator per subject. so the class scheduler handles this)

[Account] (saved in the account management to be exported or send to them soon, admin can change passwords)
Email : edu1@testing.com 
Password : edu1_pass

Students enrollment: (example)
1.
Last name : Sonio
First name : Eric james
Middle name : A.
Course : BSCS
Subjects : (Selected from the course "BSCS")
    Data structure 
    Prog1
    Com1
    PE1
Yr level : 1
Student Id : 50-0001

[Account] (account for that student) (saved in the account management to be exported or send to them soon)
Email : stud1@testing.com
password : stud1_pass

(For the remaining student accounts, those should have this since in creating an account, we need to have student details first.
and just shuffle subjects. )

Levels seed, this is for level section default (applied to all since this is not tightly for each only)
Elementary -
    Day care
    Kinder
    Yr level 1
    Yr level 2
    Yr level 3
    Yr level 4
    Yr level 5
    Yr level 6

High school - 
    Yr level 7
        Sections:
            A, B (This is just default, this is editable by the admin. just a default helper since
                    most of sections in this year have like names of something)

    Yr level 8
        Sections:
            A, B

    Yr level 9
        Sections:   
            A, B

    Yr level 10
        Sections:
            A, B


Senior high school -
    Strands seed (This strand have 2 yrs so just 11 and 12):
        GAS
            sections:
                A, B (This is just default, this is editable by the admin. just a default helper since
                    most of sections in this year have like names of something)
        ABM
            sections:
                A, B
        STEM
            sections:
                A, B
    Yr level 11
    Yr level 12

College -
    Course seeds:
        BSCS 
            Yrs:
                4 (means 1-4)
            Sections:
                A , B
        ICT
            Yrs:
                2
            Sections:
                A, B
        BSTM
            Yrs:
                4 
            Sections:
                A ,B
        TechVoc
            Yrs:
                3 (means 1-3)
            Sections:
                A, B

Course components seeds:
- educators
- subjects
- class

BSCS:
    educators:
        edu account 1 and 2
    subjects:   (Subjects that are only used in this course)
        1. 
            title: Datastruct
            description : Fundamentals of data structures
            weekday: monday 
            time:  8am - 11am
            applicable yr: 1 (means applied for BSCS - 1 only, just use in creating schedules. so it won't mixed in other yr level scheds)

        2. 
            title: Prog1 
            description : Programming and basic learning
            weekday: tuesday
            time : 8am - 11am
            applicable yr: 1 

        3. 
            title: Com1
            description : Learning the computer parts
            weekday: wednesday 
            time : 11am - 2pm
            applicable yr: 1
        4.
            title : PE 1 (From shared subjects)
            description : Physical education 1
            weekday : Friday
            time : 2pm - 5pm
            applicanble yr: 1

        5. 
            title : MMW (From shared subjects)
            description : Math in modern world
            weekday : Saturday
            titme : 2pm - 5pm
            applicable yr: 1

    class:
        class name : BSCS - 1
            classes:
            1.
                subject : data structure
                educator: edu1 (the edu assigned to handle this subject)
                status : active, inactive etc. (depends for future improvements)
                
            2.
                subject : PE 1
                educator: edu2 
                status : active

            3. 
                subject : Com1
                educator: edu1
                status: active

            4. 
                subject : Prog1
                educator: edu1
                status : active

            5. 
                subject : MMW
                educator: edu2
                status: active

        System automated schedule based on the classes. generated using the active classes. if theres conflic check based on weekdays and 
        week time. the system automatically tell the user that there's conflic. so the generated schedule will be clean.

        Title : BSCS 1 
        schedule:
            Monday      Tuesday         Wednesday       Thursday        Friday         Saturday         Sunday

            8am-11am    8am-11am
            Datastruct  Prog1
                                        11am-2pm                        
                                        Com1
                                                                        2pm -5pm        2pm-5pm
                                                                        PE 1            MMW

        
Shared Subjects (lives outside of course, since this can be used in different courses also.):
    PE 1
    PE 2
    MMW
    BusMath
    GenMath
    etc...
    (user can add more, this is reusable!)



# Class management

create class
- title
- applicable yr and course (ex. 4th yr, BSCS) (this will be only for students that is 4th yr and bscs course)
- semester (1/2) which semester is this gonna be active
- capacity (how many student can be in this class. can be set to none, if it doesnt require limit capacity)
- weekday (monday, tuesday, wednesday)
- time 

when created
* Computed weeks (based on the semester range date since the date of this is depends on the semester)
* student list (list of students that are inside the class)
    - adding student : the system validates and check this, only the students that are applicable based on the 
    appliable yr and cours of this class will be only shopwn in the selection. so its easier for the user to select. insteaf of showing all students.
* lesson list (list of lessons to be given in this class) (scope in class, since this lesson will be only used in this class.)
    - title 
    - description (optional)
    - set week (which week is this gonan be applicable. like for example, the class has 14 weeks, u set this on 
    week 4. then this is will be used in week 4. displayed also in the lesson viewer)
    - so in settign week, the lesson viewr will be opened, to let user view the lessons in weeks. so just click
    a week there , (can have 2 or more lesson in a week so its fine to click a week that already has a lesson) after selecting. then it will be the setted week of this lesson.
    - lesson detail (the lesson txt or copy paste just here the lesson) (optional)
        * why this important. the system has automatic extracting. when the lesson's detail is not empty. then it will autoamtically process the extraction (concept builder for the assessment generator to use later on.)
        (validation and checking here is the lesson detail should have a acceptable len ofwords. we set it by minimum of  10 words. so we dont jsut check if its empty, we check if the len of this is already good for building a concept. (will be use in assessment generator))
        * notes. the concept extration is automatic process. so user dont click any, just when it gives lesson detail then save. autoamticalyl this process happens in background. since it might take few minutes or seconds depedns on the response of the ai. so thuis process wont be cancelled if the user go to different pages of the applcikation. just let this happen in background and just have in notifcatiosn if the lesson is already extracted
        * this lesson will be also cleaned since in google meettings, we will be having a separate screen for the 
        lesson displaying., so the user just selects a lesson then it will display. (we wil ltalk about how we will dispaly it. let the user has likedoubly link list. so can go forward and backward. liek presentation)

* lesson viewer
    - calendar view. with the lessons. so week 1, week 2, week 3. in the calendar. if no lesson yet. then just empty. like "january 2 Week 1 : data structure ", "january 7 week 2 : empty". this is viewed like calendar so user friendly

* assessment generator (scoped within the class since the lessons inside the class can be selected by this, to create. since this wi;; have assessment history and assigned to students. now this only make sense inside a class so all the records in here will be inside only here. sincethe grade management of this class depends on this assessment generted assessments. that the student take and submit, the scores they get wuill be process by the grade managemen)
    - this is an automated assessment generator. 
    - select a lesson (from lesson management in this class. lesson list)
        * checks the lesson if it has extracted concept build. (auto mated process by the lesson itself .only happens if the lesson has lesson detail)
        * so the user obligated to put lesson detail iun the lesson in order to make it be used in generator.
    - if the selected lesson has extract concept. then the system will provide the template first for the user. 
    - template builder has , what type of assessment (quiz, activity, exam etc. (user can add more in asessment genrator settings)), num of items (how many items. (has validation here, the allowed items is based on the max item the cocept build of the lesson has. so it not exceed to the max. sicne if that happens, there some empty items or duplciated questions) so early warning and validation) . sections (1-10 identification and also select a section from the concept builder. checks if the selected section's item provede is enough for the seteted section items for this case is 1-10. if not , then allow using other section to be selected. (selecting a section is needed for the info like in students assessmnt it says 1-10 Data structure lesson  like that. so stuent knows that this section is data structre.)). after completing all. then generated. this generation also happens in background so it shouldnt be disrupt or cancelled when the user moves to different pages so move this in parallel, notif in notifiucation if this is compelted so the user knmows all. cn be cancelled =if the user choose to .  
    - once the assessment is completed. user will seelct which student to beassigned for that asessment. have option to select all. or jsut select manually.
    - the students assigned now receive the assessmetn and their grades will be depend on that. 
    - now, since for example theres some student that is not assigned, theire grades still affected by it, by default it was a loss for them so it was status as null (since for example, only present student can have the asessment and this student happens to be maybe absent so this is the dedfault thinking of the system). the user can manually set this into "excempted" so its perfect score. or the user can just set a score there manually so the status will be chagned into "customize". so its flexible. if user wants to chagne the scores, then its can be. since some teachers have good hearts lol. 

* grade management
    - this grade management's process of computing for the grades is based on the global rubrics settings.
    - such as for example activity 20%, quiz 20 %, exam 30 %, behavior 30 percent. 
    - now notice theree is a grade that our system cannot track ., which is the behjavior, so that is manualyl edit by the taecher itself so its fully manually by the user
    - the scores and grading here, deopends on the created assessments and manually edit non assessment grades such asbehavior.
    - have option to see the 
    
Notes:
validation checks:
* Week computing.
    - for example the class has 2 week day( mon and friday) its not gonna be monday to be consider as week 1 and friday is week 2. instead since this clas happens in a ssame week, we do is week1.1 week1.2. then next week, week 2.1 and week 2.2, so its accurate. the week computing depends on the week, not the times its being acticvated. if twice or more, then just do .1 and .2 and so on. 

* The class start date and end date. depends on the semster its on. since class is scoped within a semster.
so the weeks are computed basd on the range of the semester .
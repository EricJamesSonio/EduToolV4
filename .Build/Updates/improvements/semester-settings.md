check for mismatch!

Currently wwhen i create a semester template for college, its good. its working .
but when i create a semester template for senior high, i think there's a mismtached sinceit says
Assign to Programs

3de1b4b6-6b77-41dd-ac48-43812a759c19
No Senior High School programs in this year.

even tho it does have senior high school programs. the same with elementary, and other. and customs.

so fix iT..


another problem, the selection of programs in the template desnt support all programs. so the strategy to do i think is to fetch all school year's programs. they have them section of semester settings for them and also in creating , we should havethe selector for all of those progamas, sicne we have customs and those customs have types


sop this wil lbe the approach for that Option 2: Make templates per actual program (program-level scoping)

Instead of just program type, you create templates scoped per actual program, e.g.:

Program	Type	Semester Template
College	college	CollegeTemplate
TechVoc	customs	TechVocTemplate
Daycare	customs	DaycareTemplate
Kinder	customs	KinderTemplate
Pros:
Highly flexible.
Each program can have its own settings.
No messy overrides or hacks.
Cons:
Slightly more setup initially.
Could lead to many templates if you have hundreds of custom programs (but that’s okay, they’re reusable).

so teh selection is not only by program type, but the created actual program
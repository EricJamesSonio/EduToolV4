const collegeSeed: ProgramSeed = {
  name: "College",
  type: "college",
  courses: [
    {
      name: "BS Computer Science",
      code: "BSCS",
      program_type: "college",
      subjects: [
        // Major subjects (course-coupled)
        {
          name: "Data Structures",
          year_level: "2nd Year",
          term_label: "1st Sem",
          scope: "course",
          course_code: "BSCS",
          prerequisites: ["Programming Fundamentals"]
        },
        {
          name: "Algorithms",
          year_level: "2nd Year",
          term_label: "2nd Sem",
          scope: "course",
          course_code: "BSCS",
          prerequisites: ["Data Structures"]
        },
        {
          name: "Database Systems",
          year_level: "3rd Year",
          term_label: "1st Sem",
          scope: "course",
          course_code: "BSCS",
          prerequisites: ["Data Structures"]
        },
      ]
    },
    {
      name: "BS Tourism Management",
      code: "BSTM",
      program_type: "college",
      subjects: [
        {
          name: "Principles of Tourism",
          year_level: "1st Year",
          term_label: "1st Sem",
          scope: "course",
          course_code: "BSTM",
          prerequisites: []
        },
        {
          name: "Tourism Planning and Development",
          year_level: "2nd Year",
          term_label: "1st Sem",
          scope: "course",
          course_code: "BSTM",
          prerequisites: ["Principles of Tourism"]
        },
        {
          name: "Sustainable Tourism",
          year_level: "3rd Year",
          term_label: "2nd Sem",
          scope: "course",
          course_code: "BSTM",
          prerequisites: ["Tourism Planning and Development"]
        },
      ]
    }
  ],

  // Open / minor subjects (available for all courses)
  open_subjects: [
    {
      name: "Mathematics in the Modern World",
      year_level: "1st Year",
      term_label: "1st Sem",
      scope: "open",
      prerequisites: []
    },
    {
      name: "Ethics",
      year_level: "2nd Year",
      term_label: "1st Sem",
      scope: "open",
      prerequisites: ["Understanding the Self"]
    },
    {
      name: "Understanding the Self",
      year_level: "1st Year",
      term_label: "2nd Sem",
      scope: "open",
      prerequisites: []
    }
  ]
};
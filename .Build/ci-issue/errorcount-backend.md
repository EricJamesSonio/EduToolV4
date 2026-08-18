Windows 10@EricJamesSonio MINGW64 ~/Desktop/Personal/Studies/Research/EduToolV4/backend (development)
$ npx tsc --noEmit

Windows 10@EricJamesSonio MINGW64 ~/Desktop/Personal/Studies/Research/EduToolV4/backend (development)
$ npm run lint

> backend@0.0.1 lint
> eslint "{src,apps,libs,test}/\*_/_.ts" --fix

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\backend\src\modules\presentation\utils\slide-generator.utils.ts
22:7 warning 'ABBREVIATION*PLACEHOLDER' is assigned a value but never used. Allowed unused vars must match /^*/u @typescript-eslint/no-unused-vars

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\backend\src\modules\school-year\school-year-readiness.service.ts
468:13 warning 'when' is assigned a value but never used. Allowed unused vars must match /^\_/u @typescript-eslint/no-unused-vars

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\backend\src\modules\subject\subject.service.ts
53:11 warning 'ProgramRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars
58:11 warning 'CourseRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars
63:11 warning 'StrandRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars
68:11 warning 'LevelRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars

✖ 6 problems (0 errors, 6 warnings)

PS C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend> npm run lint

> frontend@0.1.0 lint
> eslint

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\api\student\lesson.api.ts
12:1 warning Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\app\educator\classes\[classId]\meetings\[meetingId]\room_components\RoomClient.tsx
88:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
137:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\app\student\classes\[classId]\meetings\[meetingId]\room_components\StudentRoomClient.tsx
74:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
165:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\app\student\meetings\[meetingId]\room_components\StudentRoomClient.tsx
66:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
123:37 error Expected an assignment or function call and instead saw an expression @typescript-eslint/no-unused-expressions

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\academic-calendar\BreakEditor.tsx
56:5 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
62:9 error 'endVal' is never reassigned. Use 'const' instead prefer-const

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\academic-calendar\HolidayBaseTab.tsx
75:7 error Expected an assignment or function call and instead saw an expression @typescript-eslint/no-unused-expressions

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\class\hooks\useClassDraft.ts
22:11 error Empty block statement no-empty
43:11 error Empty block statement no-empty

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\data-seeder\ProgramCalendarStep.tsx
49:5 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\semester-settings\TermDatesModal.tsx
82:31 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\admin\semester-settings\assign-row\use-assign-row.ts
109:17 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\educator\assessment-builder\Step3.tsx
129:9 error 'arr' is never reassigned. Use 'const' instead prefer-const

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\educator\assessment-builder\Step4.tsx
70:13 error Empty block statement no-empty

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\educator\meeting-room\PipVideo.tsx
185:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\components\meeting\ParticipantsPanel.tsx
105:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')
203:3 warning Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend\src\hooks\common\use-crud.ts
100:69 error Optional chain expressions can return undefined by design - using a non-null assertion is unsafe and wrong @typescript-eslint/no-non-null-asserted-optional-chain

✖ 21 problems (8 errors, 13 warnings)
2 errors and 13 warnings potentially fixable with the `--fix` option.

PS C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend> npx tsc --noEmit
PS C:\Users\Windows 10\Desktop\Personal\Studies\Research\EduToolV4\frontend>

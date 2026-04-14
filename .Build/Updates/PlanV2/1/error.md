[2:49:09 PM] File change detected. Starting incremental compilation...

src/core/scheduler/scheduler.tasks.ts:31:49 - error TS2339: Property 'autoLock' does not exist on type 'GradeLockService'.

31         if (org_id) await this.gradeLockService.autoLock(org_id)
                                                   ~~~~~~~~

src/modules/grade-lock/grade-lock.service.ts:268:17 - error TS2353: Object literal may only specify known properties, and 'level' does not exist in type 'SubjectInclude<DefaultArgs>'.

268                 level: { select: { id: true, name: true } },
                    ~~~~~

src/modules/grade-lock/grade-lock.service.ts:297:17 - error TS2353: Object literal may only specify known properties, and 'level' does not exist in type 'SubjectInclude<DefaultArgs>'.

297                 level: { select: { id: true, name: true } },
                    ~~~~~
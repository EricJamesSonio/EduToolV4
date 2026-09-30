okay now im thinking, in my class page, i do have there schedule creation, its laready good, it wont allow conflicts. like checking the current scheudle of the selected section, then checking the educator assgined so no conflicts. and now i want is to have oiptional. haev room management inside of the class. so its optional if they wwant to include room . like assigning rooms. so there adding rooms. like just texts. like "room 201" "room 206" "207" or what,. just free text name, then assinging it, and each room can check also the weekly sched of that room. so its optional., the current is good. just optional to include rooms. so yeah let splan for it. ask me files u need

ai response

I've got what I need for the core. Below is phase 1: the schema, the backend with the room conflict check, and the room picker on each schedule slot. The Rooms admin page and weekly view come in phase 2, once I've seen a couple of files (listed at the end).

**Two things I found that affect the design:**

1. **`ClassSchedule` is its own table**, so the room goes on each slot as a nullable `room_id`. The same class can use Room 201 on Monday and Room 206 on Wednesday, and slots with no room behave exactly as before.
2. **The backend overlap check looks unreliable.** `parseTimeToDate` stamps _today's date_ onto each slot, and `slotsOverlap` compares full timestamps. A class created last week and one created today never overlap, even at the same weekday and time. Your frontend check compares "HH:mm" strings, so it works, which may be why you haven't noticed. Also, `assertNoSectionConflict` is defined but never called. For rooms I compare minutes-of-day, so the room check doesn't have this problem. I can fix the educator and section checks the same way.

## 1. Schema

```prisma
model Room {
  id         String   @id @default(uuid())
  org_id     String
  name       String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  schedules ClassSchedule[]

  @@unique([org_id, name])
}

model ClassSchedule {
  id         String   @id @default(uuid())
  org_id     String
  class_id   String
  weekday    Int
  start_time DateTime
  end_time   DateTime
  room_id    String?

  class Class @relation(fields: [class_id], references: [id])
  room  Room? @relation(fields: [room_id], references: [id], onDelete: Restrict)

  @@index([room_id])
}
```

```bash
npx prisma migrate dev --name add_rooms
```

## 2. Backend

**`modules/room/dto/room.dto.ts`**

```ts
import { IsString, MinLength, MaxLength } from "class-validator";

export class RoomNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;
}
```

**`modules/room/room.service.ts`**

```ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DatabaseService } from "@/core/database/database.provider";

@Injectable()
export class RoomService {
  constructor(private readonly db: DatabaseService) {}

  private clean(name: string) {
    return name.trim().replace(/\s+/g, " ");
  }

  private async assertNameFree(
    orgId: string,
    name: string,
    excludeId?: string,
  ) {
    const dup = await this.db.room.findFirst({
      where: {
        org_id: orgId,
        name: { equals: name, mode: "insensitive" },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (dup)
      throw new ConflictException(`A room named "${name}" already exists.`);
  }

  private async findOwned(id: string, orgId: string) {
    const room = await this.db.room.findFirst({ where: { id, org_id: orgId } });
    if (!room) throw new NotFoundException("Room not found.");
    return room;
  }

  async list(orgId: string) {
    const rooms = await this.db.room.findMany({ where: { org_id: orgId } });
    return rooms.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  }

  async create(orgId: string, rawName: string) {
    const name = this.clean(rawName);
    await this.assertNameFree(orgId, name);
    return this.db.room.create({ data: { org_id: orgId, name } });
  }

  async rename(id: string, orgId: string, rawName: string) {
    await this.findOwned(id, orgId);
    const name = this.clean(rawName);
    await this.assertNameFree(orgId, name, id);
    return this.db.room.update({ where: { id }, data: { name } });
  }

  async remove(id: string, orgId: string) {
    await this.findOwned(id, orgId);
    // Archived classes shouldn't block deletion: detach them first.
    await this.db.classSchedule.updateMany({
      where: { room_id: id, class: { deleted_at: { not: null } } },
      data: { room_id: null },
    });
    const inUse = await this.db.classSchedule.count({ where: { room_id: id } });
    if (inUse > 0) {
      throw new ConflictException(
        `This room is used by ${inUse} schedule slot(s). Reassign them first.`,
      );
    }
    await this.db.room.delete({ where: { id } });
  }

  /** Every room-assigned slot in a school year (optionally one room). */
  async getUsage(orgId: string, schoolYearId: string, roomId?: string) {
    const rows = await this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        ...(roomId ? { room_id: roomId } : { room_id: { not: null } }),
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      include: {
        class: {
          select: {
            id: true,
            section_id: true,
            subject: { select: { name: true } },
          },
        },
      },
    });

    const sectionIds = [
      ...new Set(rows.map((r) => r.class.section_id).filter(Boolean)),
    ] as string[];
    const sections = sectionIds.length
      ? await this.db.section.findMany({
          where: { id: { in: sectionIds } },
          select: { id: true, name: true },
        })
      : [];
    const sectionName = new Map(sections.map((s) => [s.id, s.name]));

    return rows.map((r) => ({
      id: r.id,
      room_id: r.room_id,
      class_id: r.class_id,
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
      subject_name: r.class.subject?.name ?? null,
      section_name: r.class.section_id
        ? (sectionName.get(r.class.section_id) ?? null)
        : null,
    }));
  }
}
```

**`modules/room/room.controller.ts`**

```ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@/commons/guards/auth.guard";
import { RolesGuard } from "@/commons/guards/role.guard";
import { Roles } from "@/commons/decorators/roles.decorator";
import { CurrentUser } from "@/commons/decorators/current-user.decorator";
import { RoomService } from "./room.service";
import { RoomNameDto } from "./dto/room.dto";

@Controller("rooms")
@UseGuards(AuthGuard, RolesGuard)
export class RoomController {
  constructor(private readonly rooms: RoomService) {}

  @Get()
  @Roles("admin")
  list(@CurrentUser("org_id") orgId: string) {
    return this.rooms.list(orgId);
  }

  // Must stay above ':id' routes.
  @Get("usage")
  @Roles("admin")
  usage(
    @CurrentUser("org_id") orgId: string,
    @Query("schoolYearId") schoolYearId: string,
    @Query("roomId") roomId?: string,
  ) {
    return this.rooms.getUsage(orgId, schoolYearId, roomId);
  }

  @Post()
  @Roles("admin")
  create(@CurrentUser("org_id") orgId: string, @Body() dto: RoomNameDto) {
    return this.rooms.create(orgId, dto.name);
  }

  @Patch(":id")
  @Roles("admin")
  rename(
    @Param("id") id: string,
    @CurrentUser("org_id") orgId: string,
    @Body() dto: RoomNameDto,
  ) {
    return this.rooms.rename(id, orgId, dto.name);
  }

  @Delete(":id")
  @Roles("admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @CurrentUser("org_id") orgId: string) {
    await this.rooms.remove(id, orgId);
  }
}
```

**`modules/room/room.module.ts`**

```ts
import { Module } from "@nestjs/common";
import { RoomController } from "./room.controller";
import { RoomService } from "./room.service";

@Module({ controllers: [RoomController], providers: [RoomService] })
export class RoomModule {}
```

Register `RoomModule` wherever `ClassModule` is registered (probably `domains/academic/academic-domain.module.ts` or `app.module.ts`).

### Changes to the class module

**`class.dto.ts`**: add to `ScheduleSlotDto`:

```ts
  @IsOptional()
  @IsUUID()
  roomId?: string;
```

**`class.repository.ts`**: add two methods and update `replaceSchedules`:

```ts
  async countRooms(roomIds: string[], orgId: string) {
    return this.db.room.count({ where: { id: { in: roomIds }, org_id: orgId } });
  }

  async findRoomSchedules(roomIds: string[], orgId: string, schoolYearId: string) {
    return this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        room_id: { in: roomIds },
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      include: { room: { select: { name: true } } },
    });
  }

  async replaceSchedules(
    orgId: string,
    classId: string,
    slots: Array<{ weekday: number; startTime: Date; endTime: Date; roomId?: string | null }>,
  ) {
    await this.db.classSchedule.deleteMany({ where: { class_id: classId } });
    if (!slots.length) return [];
    return this.db.classSchedule.createMany({
      data: slots.map((s) => ({
        org_id: orgId,
        class_id: classId,
        weekday: s.weekday,
        start_time: s.startTime,
        end_time: s.endTime,
        room_id: s.roomId ?? null,
      })),
    });
  }
```

**`class.service.ts`**:

```ts
// 1) widen the type
type TimeSlot = ReturnType<typeof toTimeSlot> & { roomId?: string | null };

// 2) parseSlots: carry roomId through
return { weekday: s.weekday, startTime: start, endTime: end, roomId: s.roomId ?? null };

// 3) new check (put next to assertNoEducatorConflict)
private async assertRoomsFree(
  orgId: string,
  slots: TimeSlot[],
  schoolYearId: string,
  excludeClassId?: string,
) {
  const withRoom = slots.filter((s) => s.roomId);
  if (!withRoom.length) return; // rooms are optional: nothing to check

  const ids = [...new Set(withRoom.map((s) => s.roomId as string))];
  if ((await this.classRepository.countRooms(ids, orgId)) !== ids.length) {
    throw new BadRequestException('One or more selected rooms do not exist.');
  }

  const existing = await this.classRepository.findRoomSchedules(ids, orgId, schoolYearId);
  for (const e of existing) {
    if (excludeClassId && e.class_id === excludeClassId) continue;
    const eStart = this.dateToMinutes(new Date(e.start_time));
    const eEnd = this.dateToMinutes(new Date(e.end_time));
    for (const n of withRoom) {
      if (n.roomId !== e.room_id || n.weekday !== e.weekday) continue;
      if (eStart < this.dateToMinutes(n.endTime) && eEnd > this.dateToMinutes(n.startTime)) {
        throw new ConflictException(
          `${e.room?.name ?? 'That room'} is already booked on weekday ${e.weekday} at an overlapping time.`,
        );
      }
    }
  }
}

// 4) call it in create(), right after assertNoEducatorConflict:
await this.assertRoomsFree(orgId, slots, dto.schoolYearId);

// 5) and in update(), inside `if (dto.schedules)`, after assertNoEducatorConflict:
await this.assertRoomsFree(orgId, slots, cls.school_year_id, id);
```

## 3. Frontend

**`class.api.ts`**

```ts
export function toTimeString(...)      // add `export` to the existing function
export interface ScheduleSlot { weekday: number; startTime: string; endTime: string; roomId?: string }
// RawSchedule:   room_id?: string | null;
// mapSchedule:   roomId: s.room_id ?? null,
```

**`types/admin/class.types.ts`**: in `ClassSchedule`, add `roomId?: string | null;`

**`api/admin/room.api.ts`** (new)

```ts
import client from "@/api/client";
import { toTimeString } from "@/api/admin/class.api";

export interface Room {
  id: string;
  name: string;
}
export interface RoomUsage {
  id: string;
  roomId: string;
  classId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  sectionName?: string;
}
interface RawUsage {
  id: string;
  room_id: string;
  class_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  subject_name?: string | null;
  section_name?: string | null;
}

export const roomApi = {
  list: async (): Promise<Room[]> =>
    (await client.get<{ data: Room[] }>("/rooms")).data?.data ?? [],
  create: async (name: string): Promise<Room> =>
    (await client.post<{ data: Room }>("/rooms", { name })).data.data,
  rename: async (id: string, name: string): Promise<Room> =>
    (await client.patch<{ data: Room }>(`/rooms/${id}`, { name })).data.data,
  remove: async (id: string): Promise<void> => {
    await client.delete(`/rooms/${id}`);
  },
  usage: async (
    schoolYearId: string,
    roomId?: string,
  ): Promise<RoomUsage[]> => {
    const res = await client.get<{ data: RawUsage[] }>("/rooms/usage", {
      params: { schoolYearId, roomId },
    });
    return (res.data?.data ?? []).map((r) => ({
      id: r.id,
      roomId: r.room_id,
      classId: r.class_id,
      weekday: r.weekday,
      startTime: toTimeString(r.start_time),
      endTime: toTimeString(r.end_time),
      subjectName: r.subject_name ?? undefined,
      sectionName: r.section_name ?? undefined,
    }));
  },
};
```

**`hooks/admin/useRooms.ts`** (new)

```ts
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { roomApi } from "@/api/admin/room.api";

export const ROOM_KEYS = { all: ["admin", "rooms"] as const };

export const useRooms = () =>
  useAsyncQuery([...ROOM_KEYS.all, "list"], roomApi.list, {
    staleTime: 60_000,
  });

export const useRoomUsage = (schoolYearId?: string | null) =>
  useAsyncQuery(
    [...ROOM_KEYS.all, "usage", schoolYearId],
    () => roomApi.usage(schoolYearId!),
    { enabled: !!schoolYearId, staleTime: 15_000 },
  );
```

If `useAsyncQuery` insists on keys from your `queryKeys` factory, tell me and I'll add a `rooms` entry there.

**`CreateClassDialog.types.ts`**: `ScheduleSlotForm` gets `roomId?: string;`

**`ClassSchedulePicker.tsx`** changes:

```tsx
// imports
import { useRooms, useRoomUsage } from "@/hooks/admin/useRooms";

// conflict state
export interface ScheduleConflictState { educator: boolean; section: boolean; room: boolean }

// props: add
  schoolYearId?: string | null;
  excludeClassId?: string;

// local type + state
type PickedSlot = ScheduleRange & { roomId?: string };

const [ranges, setRanges] = useState<PickedSlot[]>(() =>
  initialSchedules
    .filter((s) => s?.weekday && s?.startTime && s?.endTime)
    .map((s) => ({
      weekday: Number(s.weekday),
      startMin: timeToMinutes(s.startTime),
      endMin: timeToMinutes(s.endTime),
      roomId: s.roomId || undefined,
    })),
);

// rooms
const { data: rooms = [] } = useRooms();
const { data: usage = [] } = useRoomUsage(schoolYearId);
const roomBookings = useMemo(
  () => usage.filter((u) => u.classId !== excludeClassId),
  [usage, excludeClassId],
);
const isRoomBusy = (roomId: string, r: PickedSlot): boolean =>
  roomBookings.some(
    (u) =>
      u.roomId === roomId &&
      slotsOverlap(
        { weekday: r.weekday, startTime: minutesToTime(r.startMin), endTime: minutesToTime(r.endMin) },
        u,
      ),
  );
const hasRoomConflict = ranges.some((r) => r.roomId && isRoomBusy(r.roomId, r));

const handleSetRoom = (index: number, roomId: string): void =>
  setRanges((prev) => prev.map((r, i) => (i === index ? { ...r, roomId: roomId || undefined } : r)));
```

In the form-sync `useEffect`, carry `roomId` and compare it:

```tsx
const next = ranges.map((r) => ({
  weekday: String(r.weekday),
  startTime: minutesToTime(r.startMin),
  endTime: minutesToTime(r.endMin),
  roomId: r.roomId ?? "",
}));
if (
  next.length !== now.length ||
  next.some(
    (s, i) =>
      now[i]?.weekday !== s.weekday ||
      now[i]?.startTime !== s.startTime ||
      now[i]?.endTime !== s.endTime ||
      (now[i]?.roomId ?? "") !== s.roomId,
  )
) {
  setValue("schedules", next, { shouldDirty: true });
}
```

Conflict reporting:

```tsx
onConflictsChange?.({
  educator: hasEducatorConflict || outOfWindow,
  section: hasSectionConflict || outOfWindow,
  room: hasRoomConflict,
});
// add hasRoomConflict to the deps array
```

In each slot chip, after the time `<span>` and before the ✕ button:

```tsx
{
  rooms.length > 0 && (
    <select
      value={range.roomId ?? ""}
      onChange={(e) => handleSetRoom(index, e.target.value)}
      className="h-5 rounded-sm border bg-background px-1 text-[11px]"
      aria-label="Room (optional)"
    >
      <option value="">No room</option>
      {rooms.map((room) => {
        const busy = room.id !== range.roomId && isRoomBusy(room.id, range);
        return (
          <option key={room.id} value={room.id} disabled={busy}>
            {room.name}
            {busy ? " (booked)" : ""}
          </option>
        );
      })}
    </select>
  );
}
```

Rooms already booked at that time are disabled in the dropdown, so people can't pick a conflict. Orgs with no rooms never see the dropdown.

Under the other conflict messages:

```tsx
{
  hasRoomConflict && (
    <p className="text-xs text-destructive">
      A selected room is already booked at that time.
    </p>
  );
}
```

**`ScheduleSlotFields.tsx`**: add `schoolYearId?: string | null; excludeClassId?: string;` to the props and pass both to `ClassSchedulePicker`.

**`CreateClassDialog.tsx`**: pass `schoolYearId={schoolYearId}` to `<ScheduleSlotFields>`.

**`useCreateClassForm.ts`**

```ts
const NO_CONFLICTS = { educator: false, section: false, room: false };
// payload schedules map: add   roomId: s.roomId || undefined,
// isSubmitDisabled: add        scheduleConflicts.room ||
// mutation invalidateKeys:     [queryKeys.admin.classes.all, ["admin", "rooms"]]
```

**`EditClassDialog.tsx`**

```ts
// form type
schedules: { weekday: string; startTime: string; endTime: string; roomId?: string }[];
// defaultValues map: add        roomId: s.roomId ?? "",
// payload map: add              roomId: s.roomId || undefined,
const NO_CONFLICTS = { educator: false, section: false, room: false };
// isSubmitDisabled: add         || scheduleConflicts.room
// <ScheduleSlotFields ... schoolYearId={schoolYearId} excludeClassId={cls.id} />
// invalidateKeys: add           ["admin", "rooms"]
```

**Watch out for this:** `update` replaces _all_ slots. If any client sends `schedules` without `roomId`, it silently wipes the rooms. The edit dialog above round-trips `roomId`, so it's fine. Just keep this in mind for any other caller of `PATCH /classes/:id`.

**`AdminSidebar.tsx`**: import `DoorOpen` from `lucide-react` and add this under Academic, after Classes:

```ts
{ label: "Rooms", href: "/admin/rooms", icon: DoorOpen, registrarVisible: false },
```

## Phase 2 (after phase 1 works)

The `/admin/rooms` page will have:

- an add-room input
- inline rename and delete
- a school year picker
- a room picker showing that room's weekly grid, reusing `WeeklyScheduleGrid` with the usage rows shaped as classes

For that I need `SchoolYearSelector.tsx` and `app/admin/sections/page.tsx`, so the page matches your existing list-page layout.

my response

thast nice, lets have planjning first. lets talk about it since u know it. have button there in here along side the preset bbutton. have there rooms. so clicekd it goes inroom page there , seeing the list of rooms, cards . then clicked. it will go in display the schedule of that reusaing the existign schedule component having the room schedule of that

ai response

Good idea, and it changes part of my earlier plan. Since Rooms is reached from Classes, I'd drop the sidebar entry and keep the sidebar clean.

## Flow

1. **Classes page:** a "Rooms" button next to "Preset" and "New Class", using the same button style as the others.
2. **`/admin/rooms`:** a card grid of the rooms.
   - Each card shows the room name and a small summary for the selected school year, like "12 slots this week" or "Not used yet".
   - An "Add room" button opens a small dialog with one text field.
   - Each card has a small menu for Rename and Delete.
   - A breadcrumb or back link returns to Classes.
3. **`/admin/rooms/[roomId]`:** the room's weekly schedule, reusing `WeeklyScheduleGrid` in read-only mode.
   - It's the same grid you already have, with the school's operating hours and all days shown.
   - Each block shows the subject name, the section as the sublabel, and the time range.
   - The header has the room name, a back button, and the school year selector.

## Decisions

**School year.** The Classes page already has the SY dropdown at top right. The Rooms pages should use the same selection. If it lives in a shared store or context, the card grid and the schedule view stay in sync with no extra work. If it's local state on the Classes page, I'd pass it as a `?sy=` query param instead.

**Reusing the grid.** `WeeklyScheduleGrid` takes `Class[]`, so the room's slots need to be shaped like classes. My `/rooms/usage` endpoint already returns the subject and section names, so it's a small mapper. Each class keeps its own color, which is fine for one room's week.

**Clicking a block.** I suggest it opens that class's detail page (`/admin/classes/[id]`), since it's a nice shortcut and costs one line. If you'd rather keep it read-only, say so.

**Card summaries.** The list endpoint would take an optional `schoolYearId` and return each room's slot count. One extra grouped query, so no per-card requests.

**Deleting.** A room in use can't be deleted, and the error tells you how many slots use it. Archived classes don't block it. This matches what I built in phase 1.

## Files I need

1. `app/admin/classes/page.tsx`, to place the button and see how the SY selection is stored.
2. `ClassPresetButton.tsx`, so the Rooms button matches the Preset button.
3. `SchoolYearSelector.tsx` and the hook or store behind it.
4. `PageHeader.tsx` and `PageContainer.tsx`, for the page layout.
5. One existing card-grid page, like `app/admin/programs/page.tsx` with `ProgramCard.tsx`, so the room cards look native. `CardGrid.tsx` and `EmptyState.tsx` would help too.
6. `Modal.tsx` (I've seen how it's used, but I'd like its props) and `RowActions.tsx` for the rename/delete menu.
7. `utils/classes.utils.ts`, for `slotsOverlap`, `timeToMinutes` and the other helpers I'm calling.

One question before I write it: should the Rooms button only appear on the Classes page, or do you also want a link inside the class create/edit dialog for adding a room without leaving the form? The dialog link is optional. The default is that rooms are managed only on the Rooms page, and the dropdown in the schedule picker only lists existing rooms.

my response

in class create, there has optional poutting a room there on the creating a class. and also i nclasses details, can have optional assgined room. so yeah the button rooms is care for creating rooms. so should have there first so the user canassign roomin the modal . so singlethe creation and managing of rooms deleting editing, is in rooms button .,

ai response That matches the phase 1 design, so the split is:

- **Rooms page:** the only place to create, rename and delete rooms.
- **New Class and Edit Class dialogs:** only pick a room per slot, optionally.
- **Class detail page:** shows the assigned rooms, and the existing Edit button changes them.

So I won't add "add room" links or inline creation inside the dialogs.

## Changes to what I gave you before

**Empty state in the picker.** In phase 1, the room dropdown is hidden when no rooms exist. That's confusing now that rooms are created elsewhere, so when the org has zero rooms, the slot chip will show a small "No rooms yet. Add rooms" link to `/admin/rooms`. The dropdown appears once at least one room exists. Orgs that never use rooms will see only that small link.

**Class detail page.** Slots only carry a `room_id` right now, so the detail page needs the room name. This takes three changes:

- In `class.repository.ts`, change `schedules: true` to `schedules: { include: { room: { select: { name: true } } } }` in `findAll`, `findById`, `create` and `update`.
- In `class.api.ts`, map `room_name` to `roomName` on `ClassSchedule`.
- In the `ClassInfoCard` schedule display, append the room, e.g. `Mon, Wed · 8:00 AM – 9:30 AM · Room 201`. Slots with no room look the same as today.

The detail page needs no new controls, since the Edit dialog already handles it.

**Grid blocks.** With `roomName` on each slot, I can show it in the educator and section grids inside the class dialog. That way you can see where each of their other classes meets. This is optional, and I'd do it as a small `getSublabel` tweak.

## Rooms pages (phase 2)

**`/admin/rooms`**

- Header: "Rooms", with breadcrumb Admin → Classes → Rooms, and an "Add room" button.
- School year selector, using the same selection as the Classes page.
- Card grid, one card per room, showing the name and "N slots this week" or "Not used yet". Each card has View, Rename and Delete actions.
- Empty state: "No rooms yet. Add your first room."
- One small dialog handles both add and rename, with a single text field. Delete goes through `ConfirmDialog`, and an in-use room shows the server's "used by N slots" error as a toast.

**`/admin/rooms/[roomId]`**

- Header with the room name, a back link to Rooms, and the school year selector.
- Read-only `WeeklyScheduleGrid` with the school's operating hours and all days shown.
- Blocks show subject and section. Clicking one goes to `/admin/classes/[id]`.

**Classes page.** A "Rooms" button next to Preset and New Class, styled like the Preset button (outline, small, with a `DoorOpen` icon).

**Backend extra.** `GET /rooms` takes an optional `schoolYearId` and returns each room's `slot_count`, from one grouped query.

## Files I still need

1. `app/admin/classes/page.tsx`, to place the button and see how the school year selection is stored. This decides whether Rooms shares it or uses `?sy=`.
2. `components/shared/ListItemCard.tsx`, so the room cards match the department cards.
3. `components/admin/class/detail/ClassInfoCard.tsx`, to show the room next to each schedule line.

Once I have those, I'll write phase 2 in one go: the two pages, the room dialog, the card, the Rooms button, and the `roomName` plumbing.

so continue this. becuase my ai model is out of token

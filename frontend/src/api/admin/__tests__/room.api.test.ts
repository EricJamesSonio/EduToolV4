import { roomApi } from "../room.api";
import client from "@/api/client";

jest.mock("@/api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockedGet = client.get as jest.Mock;

describe("roomApi.list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * The backend's Room model columns are snake_case, but `slotCount` is a field
   * the service ADDS in camelCase and the ResponseInterceptor does not
   * case-convert. Reading `slot_count` here silently yielded undefined, which
   * made every assigned room render as "Not used yet".
   */
  it("reads the camelCase slotCount the backend actually sends", async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: "r1", org_id: "org-1", name: "Room 201", slotCount: 4 },
          { id: "r2", org_id: "org-1", name: "Room 206", slotCount: 0 },
        ],
      },
    });

    const rooms = await roomApi.list("sy-1");

    expect(rooms[0].slotCount).toBe(4);
    // A genuine zero must survive, not be treated as "absent".
    expect(rooms[1].slotCount).toBe(0);
    expect(rooms[0].name).toBe("Room 201");
    expect(rooms[0].orgId).toBe("org-1");
  });

  it("passes the school year through as a query param", async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await roomApi.list("sy-42");
    expect(mockedGet).toHaveBeenCalledWith("/rooms", {
      params: { schoolYearId: "sy-42" },
    });
  });

  it("omits the param when no school year is given", async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });
    await roomApi.list();
    expect(mockedGet).toHaveBeenCalledWith("/rooms", { params: undefined });
  });

  it("returns an empty array when the payload is missing", async () => {
    mockedGet.mockResolvedValue({ data: {} });
    await expect(roomApi.list("sy-1")).resolves.toEqual([]);
  });
});
import { describe, expect, it } from "vitest";
import { uploadWoodTypeImage } from "@/services/uploads";

describe("services/uploads", () => {
  it("falla mientras Cloudinary no esté integrado", async () => {
    await expect(
      uploadWoodTypeImage(new File(["img"], "cedro.png", { type: "image/png" })),
    ).rejects.toThrow("Subida de imágenes pendiente de integración con Cloudinary.");
  });
});

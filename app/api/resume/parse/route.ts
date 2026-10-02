import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  let parser: PDFParse | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a PDF resume." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Resume must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    // Check the actual PDF signature.
    if (
      buffer.subarray(0, 5).toString("ascii") !==
      "%PDF-"
    ) {
      return NextResponse.json(
        { error: "The selected file is not a valid PDF." },
        { status: 400 }
      );
    }

    parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    const text = result.text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "This PDF contains no selectable text. It may be a scanned/image-only resume.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      pages: result.total,
      text: text.slice(0, 30000),
      characters: Math.min(text.length, 30000),
    });
  } catch (error) {
    console.error("PDF PARSE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `PDF parsing failed: ${error.message}`
            : "PDF parsing failed.",
      },
      { status: 500 }
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}
import { NextResponse } from "next/server";
import {
  extractText,
  getDocumentProxy,
} from "unpdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please upload a PDF resume.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The uploaded file is empty.",
        },
        { status: 400 }
      );
    }

    // Keep this below Vercel's 4.5 MB function
    // request-body limit.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "Resume must be smaller than 4 MB.",
        },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(
      await file.arrayBuffer()
    );

    // Validate PDF signature.
    const header = new TextDecoder().decode(
      buffer.slice(0, 5)
    );

    if (header !== "%PDF-") {
      return NextResponse.json(
        {
          error:
            "The selected file is not a valid PDF.",
        },
        { status: 400 }
      );
    }

    const pdf =
      await getDocumentProxy(buffer);

    const result = await extractText(pdf, {
      mergePages: true,
    });

    const text = result.text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "No selectable text was found. Scanned/image-only resumes are not supported yet.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      pages: result.totalPages,
      text: text.slice(0, 30000),
      characters: Math.min(
        text.length,
        30000
      ),
    });
  } catch (error) {
    console.error(
      "RESUME PARSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process the PDF.",
      },
      { status: 500 }
    );
  }
}
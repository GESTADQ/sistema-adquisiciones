import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generarPrepacWorkbook } from "@/lib/reportes/prepac";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const workbook = await generarPrepacWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();

  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PREPAC_${fecha}.xlsx"`,
    },
  });
}

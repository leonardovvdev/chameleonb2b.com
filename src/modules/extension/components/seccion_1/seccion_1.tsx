import { useEffect, useState } from "react";
import React from "react";
import style from "./seccion_1.module.css";
import { supabase } from "../../../../lib/supabase";
import { toPng } from "html-to-image";
import { QRCodeCanvas } from "qrcode.react";
import { images } from "../../../../assets/img";

interface ExtensionRow {
  extns_id: number;
  extns_name: string;
  extns_codigo_tsx: string;
  extns_codigo_css: string;
  extns_activa: boolean;
  cust_id: number;
}

interface Seccion1Props {
  extnsName: string;
}

// Libs disponibles para cualquier extensión guardada en la BD.
// Cada vez que instales una dependencia nueva para una extensión,
// impórtala arriba y agrégala aquí.
const libs = {
  toPng,
  QRCodeCanvas,
  images,
};

// TODO: reemplazar por el cust_id real (contexto de sesión / auth del cliente logueado)
const CUST_ID = 1;

const Seccion_1 = ({ extnsName }: Seccion1Props) => {
  const [Componente, setComponente] = useState<React.ComponentType | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarExtension = async () => {
      setCargando(true);
      setError(null);
      setComponente(null);

      if (!extnsName) {
        if (activo) {
          setError("No se especificó ninguna extensión.");
          setCargando(false);
        }
        return;
      }

      const { data, error: errSupabase } = await supabase
        .from("extensions")
        .select("*")
        .eq("cust_id", CUST_ID)
        .eq("extns_activa", true)
        .eq("extns_name", extnsName)
        .maybeSingle<ExtensionRow>();

      if (errSupabase || !data) {
        if (activo) {
          setError(`No se encontró la extensión "${extnsName}" o no está activa.`);
          setCargando(false);
        }
        return;
      }

      try {
        // 1. Inyectar el CSS de la extensión
        const styleId = `extns-style-${data.extns_id}`;
        let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = data.extns_codigo_css;

        // 2. Cargar Babel standalone solo cuando hace falta (lazy)
        const Babel = await import("@babel/standalone");

        // 3. Transpilar el TSX guardado a JS ejecutable
        const codigoJS = Babel.transform(data.extns_codigo_tsx, {
          presets: [
            ["react", { runtime: "classic" }],
            "typescript",
          ],
          plugins: ["transform-modules-commonjs"],
          filename: "extension.tsx",
        }).code;

        // 4. Ejecutar: la extensión debe hacer `export default` de su componente.
        // Recibe React y "libs" (las dependencias externas ya instaladas en el host).
        const moduleShim = { exports: {} as any };
        const factory = new Function("module", "exports", "React", "libs", codigoJS!);
        factory(moduleShim, moduleShim.exports, React, libs);

        const ComponenteExtension =
          moduleShim.exports.default ?? moduleShim.exports;

        if (activo) setComponente(() => ComponenteExtension);
      } catch (e) {
        console.error("Error interpretando extensión:", e);

        if (activo) {
          setError(
            e instanceof Error
              ? e.message
              : "Error desconocido al interpretar la extensión."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarExtension();
    return () => {
      activo = false;
    };
  }, [extnsName]);

  return (
    <div className={style.seccion}>
      {cargando && <p>Cargando extensión...</p>}
      {error && <p className={style.sinResultados}>{error}</p>}
      {Componente && <Componente />}
    </div>
  );
};

export default Seccion_1;
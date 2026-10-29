import {
  useEffect,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import style from "./sidebar.module.css";
import { supabase } from "../../../../lib/supabase";
import { icon } from "../../../../core/icons";

// Clase compartida para los links de sub-menú
const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${style.link} ${style.linkActivo}` : style.link;

// Clase para los links que se ven como título (ej. Mapa)
const tituloLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${style.tituloLink} ${style.tituloLinkActivo}` : style.tituloLink;

type CollapsibleProps = {
  id: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  nested?: boolean; // true = sección dentro de un módulo (ej. Personal)
  collapsed?: boolean; // true = sidebar colapsado (solo iconos)
  children: ReactNode;
};

const Collapsible = ({
  id,
  title,
  icon: sectionIcon,
  open,
  onToggle,
  nested = false,
  collapsed = false,
  children,
}: CollapsibleProps) => {
  const headerClass = nested
    ? `${style.tituloNested} ${style.tituloClickable}`
    : `${style.tituloSeccion} ${style.tituloClickable}`;

  const headerProps = {
    className: headerClass,
    role: "button",
    tabIndex: 0,
    title: collapsed ? title : undefined, // tooltip al colapsar
    "aria-expanded": open,
    "aria-controls": id,
    onClick: onToggle,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    },
  };

  const content = (
    <>
      {sectionIcon}
      {nested ? <span>{title}</span> : <b className={style.label}>{title}</b>}
      <span className={style.botonArrow} aria-hidden="true">
        <icon.iconArrowDown
          className={`${style.iconArrowDown} ${
            open ? style.iconArrowDownOpen : ""
          }`}
        />
      </span>
    </>
  );

  return (
    <>
      {/* Los módulos usan <p> (estilo de título); las secciones usan <div> (estilo de link) */}
      {nested ? (
        <div {...headerProps}>{content}</div>
      ) : (
        <p {...headerProps}>{content}</p>
      )}

      <div
        id={id}
        className={`${style.submenu} ${open ? style.submenuOpen : ""}`}
      >
        <div className={style.submenuInner}>{children}</div>
      </div>
    </>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [canPersonalDevelopment, setCanPersonalDevelopment] = useState(false);
  const [canBusinessManagement, setCanBusinessManagement] = useState(false);
  const [canDigitalManagement, setCanDigitalManagement] = useState(false);

  const [businessManagementOpen, setBusinessManagementOpen] = useState(true);
  const [digitalManagementOpen, setDigitalManagementOpen] = useState(false);

  const [personalOpen, setPersonalOpen] = useState(false);
  const [asistenciaOpen, setAsistenciaOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  // Si está colapsado, al pulsar un módulo se expande y se abre ese módulo
  const toggleModulo =
    (setter: Dispatch<SetStateAction<boolean>>) => () => {
      if (collapsed) {
        setCollapsed(false);
        setter(true);
      } else {
        setter((v) => !v);
      }
    };

  useEffect(() => {
    const cargarPermisos = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        localStorage.removeItem("aw_erp_jwt");
        navigate("/login");
        return;
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("cust_id")
        .eq("cust_auth_id", user.id)
        .maybeSingle();

      if (customerError || !customer) {
        localStorage.removeItem("aw_erp_jwt");
        navigate("/login");
        return;
      }

      const { cust_id } = customer;

      const { data: custModules, error: modulesError } = await supabase
        .from("customer_modules")
        .select("mod_id, modules(mod_name, mod_is_active)")
        .eq("cust_id", cust_id)
        .eq("cust_mod_is_active", true);

      if (modulesError || !custModules || custModules.length === 0) {
        localStorage.removeItem("aw_erp_jwt");
        navigate("/login");
        return;
      }

      const nombresModulos = custModules
        .filter((cm: any) => cm.modules?.mod_is_active !== false)
        .map((cm: any) => cm.modules?.mod_name)
        .filter(Boolean);

      setCanPersonalDevelopment(nombresModulos.includes("Desarrollo Personal"));
      setCanBusinessManagement(nombresModulos.includes("Gestión Empresarial"));
      setCanDigitalManagement(nombresModulos.includes("Gestión Digital"));

      setLoading(false);
    };

    cargarPermisos();
  }, [navigate]);

  if (loading) {
    return null;
  }

  const tieneAlgunModulo =
    canPersonalDevelopment || canBusinessManagement || canDigitalManagement;

  return (
    <div className={`${style.sidebar} ${collapsed ? style.collapsed : ""}`}>
      {/* CABECERA */}
      <section className={style.seccion1}>
        {collapsed ? (
          <button
            type="button"
            className={style.botonLogo}
            onClick={() => setCollapsed(false)}
            aria-label="Expandir menú"
          >
            <img
              className={style.logoImg}
              src="/1791206922783.png"
              alt="Distribuidora Ferretera Gorrioncito"
            />
            <icon.iconPanelDistribution
              className={`${style.iconAccion} ${style.iconExpandir}`}
            />
          </button>
        ) : (
          <>
            <span className={style.nombre}>GORRIONCITO</span>
            <div className={style.acciones}>
              <button
                type="button"
                className={style.botonIcono}
                aria-label="Buscar"
              >
                <icon.iconMagnifyingGlass className={style.iconAccion} />
              </button>
              <button
                type="button"
                className={style.botonIcono}
                onClick={() => setCollapsed(true)}
                aria-label="Colapsar menú"
              >
                <icon.iconPanelDistribution className={style.iconAccion} />
              </button>
            </div>
          </>
        )}
      </section>

      <section className={style.seccion2}>
        {/* DESARROLLO PERSONAL (sin icono propio: uso uno provisional al colapsar) */}
        {canPersonalDevelopment &&
          (collapsed ? (
            <p
              className={`${style.tituloSeccion} ${style.tituloClickable}`}
              title="Desarrollo Personal"
              onClick={() => setCollapsed(false)}
            >
              <icon.iconUser className={style.iconMaleta} />
            </p>
          ) : (
            <>
              <p>
                <b>Desarrollo Personal</b>
              </p>

              <NavLink to="/habits" className={navClass}>
                Hábitos
              </NavLink>
              <NavLink to="/historys" className={navClass}>
                Historial
              </NavLink>
              {/* OJO: estas 3 apuntan a la misma ruta, se activan a la vez */}
              <NavLink to="/templates" className={navClass}>
                Progreso
              </NavLink>
              <NavLink to="/templates" className={navClass}>
                Métricas
              </NavLink>
              <NavLink to="/templates" className={navClass}>
                Biblioteca
              </NavLink>
            </>
          ))}

        {/* MÓDULO: GESTIÓN EMPRESARIAL */}
        {canBusinessManagement && (
          <Collapsible
            id="submenu-empresarial"
            title="Gestión Empresarial"
            icon={<icon.iconSuitcase className={style.iconMaleta} />}
            open={businessManagementOpen}
            onToggle={toggleModulo(setBusinessManagementOpen)}
            collapsed={collapsed}
          >
            {/* SECCIÓN: PERSONAL */}
            <Collapsible
              nested
              id="submenu-personal"
              title="Personal"
              icon={<icon.iconUsers className={style.iconSub} />}
              open={personalOpen}
              onToggle={() => setPersonalOpen((v) => !v)}
            >
              <NavLink to="/list" className={navClass}>
                <icon.iconList className={style.iconSub} />
                Lista
              </NavLink>
              <NavLink to="/organizational-chart" className={navClass}>
                <icon.iconOrganizationChart className={style.iconSub} />
                Organigrama
              </NavLink>
              {/* <NavLink to="/fotocheck" className={navClass}>
                <icon.iconFotocheck className={style.iconSub} />
                Fotocheck
              </NavLink> */}
              <NavLink to="/job-position" className={navClass}>
                <icon.iconJobPosition className={style.iconSub} />
                Cargo
              </NavLink>
              <NavLink to="/roles" className={navClass}>
                <icon.iconOfficeUser className={style.iconSub} />
                Rol
              </NavLink>
            </Collapsible>

            {/* SECCIÓN: ASISTENCIA */}
            <Collapsible
              nested
              id="submenu-asistencia" /* antes repetía "submenu-personal" */
              title="Asistencia"
              icon={<icon.iconAttendance className={style.iconSub} />}
              open={asistenciaOpen}
              onToggle={() => setAsistenciaOpen((v) => !v)}
            >
              <NavLink to="/registers" className={navClass}>
                <icon.iconRegister className={style.iconSub} />
                Registros
              </NavLink>
              {/* <NavLink to="/a" className={navClass}>
                <icon.iconAlert className={style.iconSub} />
                Incidencias
              </NavLink> */}
              <NavLink to="/reports" className={navClass}>
                <icon.iconStatistics className={style.iconSub} />
                Reportes
              </NavLink>
              {/* <NavLink to="/a" className={navClass}>
                <icon.iconClock className={style.iconSub} />
                Horarios
              </NavLink> */}
            </Collapsible>
          </Collapsible>
        )}

        {/* GESTIÓN DIGITAL */}
        {canDigitalManagement && (
          <Collapsible
            id="submenu-digital"
            title="Gestión Digital"
            icon={<icon.iconGestionDigital className={style.iconMaleta} />}
            open={digitalManagementOpen}
            onToggle={toggleModulo(setDigitalManagementOpen)}
            collapsed={collapsed}
          >
            <NavLink to="/web" className={navClass}>
              <icon.iconGlobo className={style.iconSub} />
              Sitio Web
            </NavLink>
            <NavLink to="/mobile" className={navClass}>
              <icon.iconMovil className={style.iconSub} />
              Aplicación Móvil
            </NavLink>
            <NavLink to="/appearance" className={navClass}>
              <icon.iconColorPalette className={style.iconSub} />
              Diseño y Apariencia
            </NavLink>
            <NavLink to="/configuration" className={navClass}>
              <icon.iconConfiguration className={style.iconSub} />
              Configuración
            </NavLink>
          </Collapsible>
        )}

        {/* ALMACENAMIENTO (link directo, al mismo nivel que Personal y Asistencia) */}
        {tieneAlgunModulo && (
          <p className={style.tituloSeccion}>
            <NavLink to="/storage" className={tituloLinkClass}>
              <icon.iconFile className={style.iconMaleta} />
              <span className={style.label}>Almacenamiento</span>
            </NavLink>
          </p>
        )}

        {/* CALENDARIO */}
        {/* {tieneAlgunModulo && (
          <p className={style.tituloSeccion}>
            <NavLink to="/calendar" className={tituloLinkClass} title="Calendar">
              <icon.iconCalendar className={style.iconMaleta} />
              <span className={style.label}>Calendario</span>
            </NavLink>
          </p>
        )} */}

        {/* MAPA */}
        {tieneAlgunModulo && (
          <p className={style.tituloSeccion}>
            <NavLink to="/map" className={tituloLinkClass} title="Mapa">
              <icon.iconMap className={style.iconMaleta} />
              <span className={style.label}>Mapa</span>
            </NavLink>
          </p>
        )}

        {/* ANUNCIO */}
        {tieneAlgunModulo && (
          <p className={style.tituloSeccion} title="Anuncio">
            <icon.iconAdvertisement className={style.iconMaleta} />
            <b className={style.label}>Anuncio</b>
          </p>
        )}

        {/* CONFIGURACIÓN */}
        {tieneAlgunModulo && (
          <p className={style.tituloSeccion} title="Configuración">
            <icon.iconConfiguration className={style.iconMaleta} />
            <b className={style.label}>Configuración</b>
          </p>
        )}
      </section>
    </div>
  );
};

export default Sidebar;
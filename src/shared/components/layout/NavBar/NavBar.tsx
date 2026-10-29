import style from "./NavBar.module.css";


const NavBar = () =>{
    return(
      <div className={style.navbar}>
        <div className={style.navbar1}>
          <div className={style.logo}>
            <span className={style.build}>Build</span>
            <span className={style.legends}>Legends</span>
          </div>

          <div className={style.links}>
            <a href="/">Home</a> <hr className={style['hr-vertical']} />
            <a href="/champions">Builds</a> <hr className={style['hr-vertical']} />
            <a href="/items">Items</a> <hr className={style['hr-vertical']} />
            <a href="/runes">Runes</a>
          </div>

        </div>
        <hr />
      </div>
    );
}

export default NavBar;
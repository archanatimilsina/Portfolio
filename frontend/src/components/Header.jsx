import '../assets/css/Header.css';
import { Link } from 'react-router-dom';
function Header(){
    return(
        <>
        <div id="header">
<ul>
    <li><Link to="/skill">Skills</Link></li>
    <li><Link to="/project">Projects</Link></li>
    <li><Link to="/experience">Experiences</Link></li>
    <li><Link to="/contact">Contact</Link></li>
</ul>
        </div>
        </>
    );
}
export default Header;
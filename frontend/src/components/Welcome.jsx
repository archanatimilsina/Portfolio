import '../assets/css/Welcome.css';
import archana from "../assets/img/archana.JPG";
import sticker2 from "../assets/img/sticker2.png";


import { Link } from 'react-router-dom';


function Welcome(){
  const professionalDev=[
  {name: "Mentorship", duration: "2 months", company:"Jankari Tech",subject:"Test Automation",Link:"https://drive.google.com/file/d/1uZJbIsYGSxLSkGsdx_GuVo6H33pmEEmr/view"},
  {name: "Internship", duration: "3 months", company:"Xdezo Academy",subject:"Full Stack Web Development",Link:"https://drive.google.com/file/d/1b8dPLHQR36n5ZixoX0qEstRi7OHu7IqE/view"},
  {name: "Course", duration: "3 months", company:"Xdezo Academy",subject:"Full Stack Web Development",Link:"https://drive.google.com/file/d/1Xgit-dCH7ehOVifsh4YkENpfZMGFucnN/view"},
  {name: "Fellowship", duration: "6 months", company:"WLiT",subject:"personal skills + technical skills",Link:"https://drive.google.com/file/d/1cJsRaZkDpZytJ10yFp0Zd7eK_x_Hj4Si/view"},
  {name: "Session", duration: "1 Day", company:"GCES girls tech",subject:"Design Thinking and UI/UX",Link:"https://drive.google.com/file/d/1GCMMNwovHVVldKWNrj1Y3tMCMPh9CYw2/view"},
  {name: "Online Course", duration: "-", company:"Simplilearn",subject:"Javascript",Link:"https://drive.google.com/file/d/1ytlPLBAWXP8dGCMttW5SL7M5cpflvWYL/view"}
  ]

const projects=[
  {name: "Swiftstay", projectNote:"Online Hotel services reservation system",github_link:"https://github.com/archanatimilsina/SwiftStay", description:""},
  {name: "Aahar", projectNote:"Online Local food Seller",github_link:"https://github.com/oogke/Aahar", description:""},
  {name: "Ownah", projectNote:"Task and Employee Management System ",github_link:"https://github.com/archanatimilsina/Task_and_Employee_management", description:""},
  {name: "Menthealth", projectNote:"Online mental Health support system",github_link:"https://github.com/archanatimilsina/mental_health_support_system", description:""},
  {name: "Tasksphere", projectNote:"Task and Employee Management System",github_link:"https://github.com/oogke/TaskSphere", description:""},
  {name: "SoulAPI", projectNote:"API practice project",github_link:"https://github.com/oogke/soulApi", description:""},
];
    return(
        <>
        {/* welcome Page */}
     <div id="welcome">
        <div className="introductionSection">
<div className="profileBox">
<img src={archana} alt="not found" />
</div>
<div className="introBox">
<h1>Hello, I am <span>Archana Timilsina</span></h1>
<p>Currently, I am pursuing Computer Engineering. I enjoy exploring new technologies and improving my skills.</p>
<img src={sticker2} alt="not found" />
</div> 
</div>
     </div>
     {/* welcome Page */}


{/* Skill Page */}
 <section className="skillSection">
    <div className="skillBoxes">
  <div className="skillBox programmingLanguage">
            <h1>Programming Language</h1>
            <ul>
                 <li>C</li>
                <li>C++</li>
                <li>Python</li>
                <li>PHP</li>
            </ul>
        </div>
        <div className="skillBox frontend">
            <h1>Frontend</h1>
            <ul>
                <li>HTML</li>
                <li>CSS</li>
                <li>JavaScript</li>
                <li>TypeScript</li>
                <li>Bootstrap</li>
                <li>React.js</li>
            </ul>
        </div>
        <div className="skillBox backend">
            <h1>Backend</h1>
            <ul>
                <li>Node.js(basic)</li>
                <li>Laravel</li>
                <li>PHP</li>
            </ul>
        </div>
        <div className="skillBox testingSkill">
 <h1>Testing</h1>
 <ul> 
                <li>Playwright</li>
                <li>Cucumber</li>
            </ul>

        </div>
         <div className="skillBox tools">
            <h1>Tools</h1>
            <ul>
                <li>Docker</li>
                <li>Gherkin</li>
            </ul>
        </div>
    </div>
 </section>

{/* Skill Page */}


{/* Experience Page */}
 <div id="experience">
        <div className="experienceBox">
          <h2>Professional Development</h2>
          <div className="experienceSliderBox">
            {professionalDev.map((list,index)=>(
              <div className="professionalDevList" key={index}>
            <h1>{list.name}</h1>
            <p><b>Duration:</b> {list.duration}</p>
            <p><b>Company:</b> {list.company}</p>
            <p><b>Subject:</b> {list.subject}</p>
<Link to={list.Link} target="_blank">
  <button id="checkCertificate">Check Certificate</button>
</Link>             
</div>
            )
           ) 
            }
          </div>
        </div>
      </div>
{/* Experience Page */}

{/* Project Page */}
 <div id="projects">
        <div className="projectBox">
          <h2>My Projects</h2>
          <div className="projectSliderBox">

{projects.map((project,index)=>
  (
    <div className="projectList" key={index}>
<h3>{project.name}</h3>
<p className="projectNote">{project.projectNote}</p>
<Link to={project.github_link} target="_blank">
<button className="github-button">Github</button>
</Link>
{/* <button className="checkDescription">Check Description</button> */}
</div>
  )
)}
          </div>
        </div>

      </div>

{/* Project Page */}

{/* contact page  */}
      <div id="contact">
          <h2>Contact Details</h2>
         <div className="contact-item">
    <i className="fa-solid fa-envelope"></i>
    <span>archanatimilsina88@gmail.com</span>
  </div>

  <div className="contact-item">
    <i className="fa-solid fa-phone"></i>
    <span>+977 9861433446</span>
  </div>

  <div className="contact-item">
    <i className="fa-brands fa-github"></i>
    <Link to="https://github.com/archanatimilsina" target="_blank">
      github.com/archanatimilsina
    </Link>
  </div>

  <div className="contact-item">
    <i className="fa-brands fa-linkedin"></i>
    <Link to="https://www.Linkedin.com/in/archana-timilsina-2776a6342/" target="_blank">
      Linkedin.com/in/archana-timilsina-2776a6342
    </Link>
  </div>
      </div>

{/* contact page  */}
        </>
    );
}
export default Welcome;
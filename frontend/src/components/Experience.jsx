import "../assets/css/Experience.css"
function Experience() {
  const professionalDev=[
  {name: "Mentorship", duration: "2 months", company:"Jankari Tech",subject:"Test Automation",link:"https://drive.google.com/file/d/1uZJbIsYGSxLSkGsdx_GuVo6H33pmEEmr/view"},
  {name: "Internship", duration: "3 months", company:"Xdezo Academy",subject:"Full Stack Web Development",link:"https://drive.google.com/file/d/1b8dPLHQR36n5ZixoX0qEstRi7OHu7IqE/view"},
  {name: "Course", duration: "3 months", company:"Xdezo Academy",subject:"Full Stack Web Development",link:"https://drive.google.com/file/d/1Xgit-dCH7ehOVifsh4YkENpfZMGFucnN/view"},
  {name: "Fellowship", duration: "6 months", company:"WLiT",subject:"personal skills + technical skills",link:"https://drive.google.com/file/d/1cJsRaZkDpZytJ10yFp0Zd7eK_x_Hj4Si/view"},
  {name: "Session", duration: "1 Day", company:"GCES girls tech",subject:"Design Thinking and UI/UX",link:"https://drive.google.com/file/d/1GCMMNwovHVVldKWNrj1Y3tMCMPh9CYw2/view"},
  {name: "Online Course", duration: "-", company:"Simplilearn",subject:"Javascript",link:"https://drive.google.com/file/d/1ytlPLBAWXP8dGCMttW5SL7M5cpflvWYL/view"}
  ]
  function openLink(link){
window.open(link ,"_blank");
  }

  return (
    <>
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
            <button id="checkCertificate" onClick={openLink(list.link)}>Check Certificate</button>
             </div>
            )
           ) 
            }
          </div>
        </div>
      </div>
    </>
  );
}
export default Experience;

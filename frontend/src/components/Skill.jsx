import "../assets/css/Skill.css";

function Skill() {
  const programmingLanguages = [
   "C",
   "C++",
    "Python",
    "PHP"
  ];
  const frontend= [
 "HTML",
    "CSS",
    "JavaScript",
    "React.js",
    "TypeScript",
    "Bootstrap"
  ];

  const backend= [
 "Node.js",
  "Laravel",
  "PHP"
  ];

  const testing=[
    "Playwright",
    "Cucumber"
  ]

  const tools = [
    { name: "Docker" },
    { name: "Github"}
  ];

  return (
    <section id="skill">
      <div className="skill-container">
        <div className="programmingLanguage">
          <h2>Programming Languages</h2>
          <div className="skillSliderBox">
            {programmingLanguages.map((lang, index) => (
              <div key={index} className="languageItem">
                <p className="languageName">{lang}</p>
              </div>
            ))}
          </div>
        </div>
          <div className="programmingLanguage">
          <h2>Frontend</h2>
          <div className="skillSliderBox">
            {frontend.map((lang, index) => (
              <div key={index} className="languageItem">
                <p className="languageName">{lang}</p>
              </div>
            ))}
          </div>
        </div>
          <div className="programmingLanguage">
          <h2>Backend</h2>
          <div className="skillSliderBox">
            {backend.map((lang, index) => (
              <div key={index} className="languageItem">
                <p className="languageName">{lang}</p>
              </div>
            ))}
          </div>
        </div>
         <div className="programmingLanguage">
          <h2>Testing</h2>
          <div className="skillSliderBox">
            {testing.map((lang, index) => (
              <div key={index} className="languageItem">
                <p className="languageName">{lang}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tools">
          <h2>Tools</h2>
          <div className="skillSliderBox">
            {tools.map((tool, index) => (
              <div key={index} className="languageItem">
                <p className="languageName">{tool.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Skill;

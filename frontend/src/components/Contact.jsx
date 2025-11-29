import "../assets/css/Contact.css";
function Contact(){
    return(
        <>
      <div id="contact">
          <h2>Contact Details</h2>
         <div class="contact-item">
    <i class="fa-solid fa-envelope"></i>
    <span>your-email@example.com</span>
  </div>

  <div class="contact-item">
    <i class="fa-solid fa-phone"></i>
    <span>+977 98XXXXXXXX</span>
  </div>

  <div class="contact-item">
    <i class="fa-brands fa-github"></i>
    <a href="https://github.com/yourusername" target="_blank">
      github.com/yourusername
    </a>
  </div>

  <div class="contact-item">
    <i class="fa-brands fa-linkedin"></i>
    <a href="https://linkedin.com/in/your-linkedin-id" target="_blank">
      linkedin.com/in/your-linkedin-id
    </a>
  </div>
      </div>
        </>
    );
}
export default Contact;
import { NavLink } from "react-router";
import React from "react";


const DropdownButton = ({ isOpen, toggleDropdown}) => {
    return (
        <button className="news-article-dropdown-button" onClick={toggleDropdown}>
            {isOpen ? "▬" : "▼"}
        </button>
    );
};

export default function NewsArticle(props) {
    const [isOpen, setIsOpen] = React.useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="news-article">
            <div className="news-article-image-container">
                <img className="news-article-image" src="../src/assets/images/f14.jpg" alt="F14" />
            </div>
            <div className="news-article-text-container">
                <h2 className="news-article-title">{props.title}</h2>
                <DropdownButton className="news-article-dropdown-button" isOpen={isOpen} toggleDropdown={toggleDropdown} />
                <h2 className="news-article-title-underline">{"-".repeat(props.title.length)}</h2>
                {isOpen ? ( <p className="news-article-content">{props.content}</p> ) : ( <p className="news-article-content">{props.content.substring(0, 410)}...</p> )}
            </div>
        </div>
    )
}

export { DropdownButton };
import '../assets/styles/news.css'
import NewsArticle from "../components/NewsArticle";

export default function News() {
    return (
        <>
            <div className="news-articles-list">
                <NewsArticle
                    title="Sample News Article"
                    content=" Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean molestie ipsum dolor. Nullam vulputate, libero in elementum semper, urna turpis vehicula justo, eget convallis nisl quam sed nibh. Etiam mattis, dolor nec varius maximus, augue nunc consectetur dui, ac cursus ipsum nibh nec diam. Ut eu sagittis elit. Sed lectus dolor, mattis non malesuada a, ornare nec tellus. Praesent elementum urna ipsum, quis imperdiet turpis suscipit sit amet. Maecenas velit massa, tincidunt a lacus id, aliquam gravida dolor. Aenean suscipit imperdiet dolor, vel facilisis massa hendrerit vel. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean molestie ipsum dolor. Nullam vulputate, libero in elementum semper, urna turpis vehicula justo, eget convallis nisl quam sed nibh. Etiam mattis, dolor nec varius maximus, augue nunc consectetur dui, ac cursus ipsum nibh nec diam. Ut eu sagittis elit. Sed lectus dolor, mattis non malesuada a, ornare nec tellus. Praesent elementum urna ipsum, quis imperdiet turpis suscipit sit amet. Maecenas velit massa, tincidunt a lacus id, aliquam gravida dolor. Aenean suscipit imperdiet dolor, vel facilisis massa hendrerit vel."
                />
                <NewsArticle
                    title="Sample News Article"
                    content=" Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean molestie ipsum dolor. Nullam vulputate, libero in elementum semper, urna turpis vehicula justo, eget convallis nisl quam sed nibh. Etiam mattis, dolor nec varius maximus, augue nunc consectetur dui, ac cursus ipsum nibh nec diam. Ut eu sagittis elit. Sed lectus dolor, mattis non malesuada a, ornare nec tellus. Praesent elementum urna ipsum, quis imperdiet turpis suscipit sit amet. Maecenas velit massa, tincidunt a lacus id, aliquam gravida dolor. Aenean suscipit imperdiet dolor, vel facilisis massa hendrerit vel. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean molestie ipsum dolor. Nullam vulputate, libero in elementum semper, urna turpis vehicula justo, eget convallis nisl quam sed nibh. Etiam mattis, dolor nec varius maximus, augue nunc consectetur dui, ac cursus ipsum nibh nec diam. Ut eu sagittis elit. Sed lectus dolor, mattis non malesuada a, ornare nec tellus. Praesent elementum urna ipsum, quis imperdiet turpis suscipit sit amet. Maecenas velit massa, tincidunt a lacus id, aliquam gravida dolor. Aenean suscipit imperdiet dolor, vel facilisis massa hendrerit vel."
                />
            </div>
        </>
    );
};
import NavBar from "../features/navbar/Navbar";
import ProductList from "../features/product/components/ProductList";
import Footer from "../features/common/Footer";

function Home() {
    function go3dPrinting() {
        window.location.href = "/3dprinting";
    }

    function RazorpayPage() {
        window.location.href = "/razorpay-callback";
    }

    return (
        <div>
            <NavBar>
                <ProductList />
                <button onClick={go3dPrinting}>3D Printing</button>
                <br />
                <button onClick={RazorpayPage}>Razorpay Checkout</button>
            </NavBar>
            <Footer />
        </div>
    );
}

export default Home;

import { Link } from "react-router-dom";
import NavBar from "../features/navbar/Navbar";
import ProductList from "../features/product/components/ProductList";
import Footer from "../features/common/Footer";
import StripeCheckout from "./StripeCheckout";

function Home() {

    function go3dPrinting()  {
        window.location.href = "/3dprinting";
    }
    function StripePage()  {
        window.location.href = "/stripe-checkout/";
    }

    return ( 
        <div>
            <NavBar>
                <ProductList></ProductList>
                <button onClick={go3dPrinting}>3d Printing</button>
                <br />
                <button onClick={StripePage}>Stripe Checkout</button>

            </NavBar>
            <Footer></Footer>
        </div>
     );
}

export default Home;
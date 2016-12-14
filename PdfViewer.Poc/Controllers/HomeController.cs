using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PdfViewer.Poc.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Title = "Home Page";

            return View();
        }

        public ActionResult PrizmDoc()
        {
            return View();
        }

        public ActionResult CloudPrizmDoc()
        {
            return View();
        }

        public ActionResult FlexPaper()
        {
            return View();
        }

    }
}

using MvcPccViewerSamples.Models.Pcc;
using System.Web.Mvc;

namespace PdfViewer.Poc.Controllers
{
    public class PccController : Controller
    {
        public void Index(string path)
        {
            PrizmApplicationServices.ForwardRequest(System.Web.HttpContext.Current, path);
        }
    }
}

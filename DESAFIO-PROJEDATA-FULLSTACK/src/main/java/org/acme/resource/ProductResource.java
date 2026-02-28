package org.acme.resource;

import org.acme.model.Product;
import org.acme.service.ProductService;
import org.acme.socket.InventorySocket;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    @Inject
    ProductService productService;

    @Inject
    InventorySocket socket;

    @GET
    public List<Product> list() {
        return Product.listAll();
    }

    @POST
    public Response create(Product product) {
        productService.createProduct(product);
        socket.broadcast("REFRESH");
        return Response.status(Response.Status.CREATED).entity(product).build();
    }

    @GET
    @Path("/suggestion")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProductionSuggestion() {
        Map<String, Object> result = productService.calculateProductionSuggestion();
        return Response.ok(result).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, Product product) {
        Product updated = productService.updateProduct(id, product);
        socket.broadcast("REFRESH");
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        productService.deleteProduct(id);
        socket.broadcast("REFRESH");
        return Response.noContent().build();
    }
}
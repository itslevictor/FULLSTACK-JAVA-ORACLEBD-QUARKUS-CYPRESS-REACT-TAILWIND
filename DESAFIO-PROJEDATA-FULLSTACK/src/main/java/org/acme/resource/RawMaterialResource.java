package org.acme.resource;

import org.acme.model.RawMaterial;
import org.acme.model.ProductIngredient;
import org.acme.socket.InventorySocket;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RawMaterialResource {

    @Inject
    InventorySocket socket;

    @GET
    public List<RawMaterial> listAll() {
        return RawMaterial.listAll();
    }

    @POST
    @Transactional
    public Response create(RawMaterial material) {
        // Verifica duplicidade de nome
        RawMaterial existing = RawMaterial.find("LOWER(name) = LOWER(?1)", material.name).firstResult();
        if (existing != null) {
            return Response.status(Response.Status.CONFLICT)
                           .entity("The material '" + material.name + "' is already saved.")
                           .build();
        }

        if (material.stockQuantity < 0) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Quantity need to be higher then 0").build();
        }
        material.id = null; 
        material.persist();
        socket.broadcast("REFRESH"); 
        return Response.status(Response.Status.CREATED).entity(material).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, RawMaterial material) {
        RawMaterial entity = RawMaterial.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Verifica duplicidade (se mudar o nome para um que já existe em outro ID)
        RawMaterial existing = RawMaterial.find("LOWER(name) = LOWER(?1) AND id != ?2", material.name, id).firstResult();
        if (existing != null) {
            return Response.status(Response.Status.CONFLICT)
                           .entity("Already Exists a material named: " + material.name)
                           .build();
        }
        
        if (material.stockQuantity < 0) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Quantity need to be higher then 0").build();
        }

        entity.name = material.name;
        entity.stockQuantity = material.stockQuantity;
        socket.broadcast("REFRESH"); 
        return Response.ok(entity).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        List<ProductIngredient> vinculados = ProductIngredient.list("rawMaterial.id", id);
        
        if (!vinculados.isEmpty()) {
            String productName = vinculados.get(0).product.name;
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("This Material is on: " + productName)
                           .build();
        }

        boolean deleted = RawMaterial.deleteById(id);
        if (deleted) {
            socket.broadcast("REFRESH"); 
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}
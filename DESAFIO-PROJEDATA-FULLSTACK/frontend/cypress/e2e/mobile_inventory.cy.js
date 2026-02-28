describe('Inventory Management System - Mobile Flow', () => {
    const uniqueId = Date.now();
    const materialName = `Material-${uniqueId}`;
    const productName = `Product-${uniqueId}`;
  
    beforeEach(() => {
      // Intercepta as chamadas de API para garantir que o Cypress espere o backend
      cy.intercept('POST', '**/materials').as('postMaterial');
      cy.intercept('POST', '**/products').as('postProduct');
      cy.intercept('GET', '**/products/suggestion').as('getSuggestions');
  
      cy.viewport(414, 896);
      cy.visit('http://localhost:5173');
    });
  
    it('should complete a full production cycle on mobile devices', () => {
      
      // --- 1. CADASTRO DE MATERIAL ---
      cy.get('nav.lg\\:hidden').contains('Materials').click();
      
      cy.get('main').within(() => {
        cy.get('input[placeholder="Ex: Chapas de Aço"]').type(materialName);
        cy.get('input[type="number"]').first().clear().type('20');
        cy.get('button').contains('+ Add').click();
      });
  
      // Espera o material ser salvo no banco antes de prosseguir
      cy.wait('@postMaterial');
      cy.get('main').find('button').contains('VOLTAR').click();
  
      // --- 2. CADASTRO DE PRODUTO ---
      cy.get('nav.lg\\:hidden').contains('Products').click();
  
      cy.get('main').within(() => {
        cy.get('input[placeholder="Ex: Gaming Chair"]').type(productName);
        cy.get('input[placeholder="0.00"]').type('50.00');
  
        // Seleciona o material (aguarda o elemento estar visível)
        cy.get('select').should('be.visible').select(`${materialName} (Stock: 20)`);
        cy.get('input[placeholder="0"]').type('4');
        
        cy.get('button').contains('Add').click();
  
        // Valida se o material apareceu na lista da receita (BOM)
        cy.contains(materialName).should('be.visible');
  
        // Clica em salvar e espera a resposta do servidor
        cy.get('button').contains('Save Final Product').click();
      });
  
      cy.wait('@postProduct');
      cy.get('main').find('button').contains('VOLTAR').click();
  
      // --- 3. VERIFICAÇÃO NO DASHBOARD ---
      cy.get('nav.lg\\:hidden').contains('Dash').click();
      
      // Força o recarregamento das sugestões para garantir que o novo produto apareça
      cy.wait('@getSuggestions');
  
      cy.get('main').within(() => {
        // O timeout de 10s ajuda se o backend for lento, mas o intercept é mais seguro
        cy.contains('h3', productName, { timeout: 15000 }).should('be.visible');
        
        cy.contains('h3', productName)
          .parents().eq(1) // Sobe na hierarquia até o card do produto
          .within(() => {
            cy.get('span.text-2xl').should('contain', '5');
            cy.contains('R$ 250,00').should('be.visible');
          });
      });
    });
        // Teste "infeliz" para mostrar o caminho que nao consegue criar produto

    it('should prevent saving product without materials on mobile', () => {
      cy.get('nav.lg\\:hidden').contains('Products').click();
      
      cy.get('main').within(() => {
        cy.get('input[placeholder="Ex: Gaming Chair"]').type('Invalid Mobile Prod');
        cy.get('input[placeholder="0.00"]').type('10.00');
        cy.get('button').contains('Save Final Product').click();
        
        // Valida a mensagem de erro da Imagem 21c8bb.png
        cy.contains('Fill out the entire form and add at least one material.').should('be.visible');
      });
    });
  });
describe('Inventory Management System E2E', () => {
  // Geramos um sufixo aleatório para evitar que o banco de dados 
  // com dados de testes anteriores cause erro de duplicidade
  const uniqueId = Date.now();
  const materialName = `Water-${uniqueId}`;
  const productName = `Juice-${uniqueId}`;

  beforeEach(() => {
    // Resolução Full HD para garantir que os elementos 'lg:block' apareçam
    cy.viewport(1280, 900); 
    cy.visit('http://localhost:5173'); 
  });

  it('should register a raw material', () => {
    // Cadastro de material simples para testar a lista
    cy.get('input[placeholder="Ex: Chapas de Aço"]').type('Sugar');
    // Pegamos o primeiro input de número (estoque)
    cy.get('input[type="number"]').first().clear().type('100');
    
    // Clicamos especificamente no botão de adicionar material (o primeiro "Add" da página)
    cy.get('button').contains('Add').first().click();
    
    cy.contains('Sugar').should('be.visible');
  });

  it('should calculate production suggestion correctly', () => {
    // 1. Cadastrar Material com nome único que será usado no produto
    cy.get('input[placeholder="Ex: Chapas de Aço"]').type(materialName);
    cy.get('input[type="number"]').first().clear().type('10');
    cy.get('button').contains('Add').first().click();
    
    // Pequena garantia: espera o material aparecer na lista lateral/dashboard antes de prosseguir
    cy.contains(materialName).should('be.visible');

    // 2. Cadastrar Produto
    cy.get('input[placeholder="Ex: Gaming Chair"]').type(productName);
    cy.get('input[placeholder="0.00"]').type('5.00');
    
    // Seleciona o material no dropdown do formulário de produto
    // Como usamos o nome único, ele será o último ou um dos últimos da lista
    cy.get('select').select(`${materialName} (Stock: 10)`);

    // Quantidade necessária para o produto (é o input com placeholder "0" dentro do BOM)
    // No seu código, ele costuma ser o último input de número renderizado
    cy.get('input[placeholder="0"]').last().clear().type('2');
    
    // --- CORREÇÃO CRÍTICA DO CLIQUE ---
    // Em vez de 'cy.get(button).contains(Add)', vamos ancorar no container da receita (BOM)
    // para garantir que estamos clicando no botão "Add" do formulário de PRODUTO.
    cy.contains('Bill of Materials').parent().find('button').contains('Add').click();
    
    // Verifica visualmente se o ingrediente entrou na lista da receita antes de salvar
    // Isso evita o erro de "receita vazia" causado por processamento assíncrono
    cy.get('div').contains(materialName).should('exist');

    // Salvar Produto Final
    cy.get('button').contains('Save Final Product').click();

    // 3. Verificar Sugestão
    // O sistema agora chama o Backend Java. 10 de estoque / 2 por un = 5 sugeridos.
    cy.get('h2').contains('Production Suggestion').scrollIntoView();
    
    // Aumentamos o timeout para 10s para dar tempo do Java processar e o Redux atualizar a tela
    cy.contains(productName, { timeout: 10000 }).should('be.visible');
    
    // Verifica se o número 5 (quantidade sugerida) aparece na área de sugestões
    // Procuramos especificamente dentro do card do produto recém criado
    cy.contains(productName).parents('.bg-slate-800\\/50').within(() => {
      cy.contains('5').should('be.visible');
    });
  });
});
UPDATE recipes
SET notes = CASE name
  WHEN 'Barra recheada 350g' THEN 'Barra recheada com casquinha de chocolate e recheio cremoso, perfeita para presentear ou matar a vontade de um doce especial.'
  WHEN 'Caixa com 10 trufas' THEN 'Caixa com 10 trufas artesanais, ideal para presentear, compartilhar ou deixar seu momento ainda mais gostoso.'
  WHEN 'Ovo Trufado 350g' THEN 'Ovo trufado com casca de chocolate e recheio cremoso na medida certa para um mimo delicioso e elegante.'
  WHEN 'Ovo Trufado 500g' THEN 'Ovo trufado generoso, com bastante recheio e acabamento artesanal para surpreender em qualquer ocasião.'
  WHEN 'Ovo de colher 350g' THEN 'Ovo de colher com casca de chocolate e recheio cremoso, ideal para quem quer uma sobremesa especial na medida certa.'
  WHEN 'Ovo de colher 500g' THEN 'Ovo de colher cremoso e caprichado, com muito recheio para quem ama uma experiência bem chocolatuda.'
  WHEN 'Ovo de colher 750g' THEN 'Ovo de colher tamanho família, recheado com fartura para presentear ou dividir em um momento especial.'
  WHEN 'Ovo infantil s/ brinde' THEN 'Ovo infantil divertido e delicioso, feito para encantar os pequenos com muito chocolate e carinho.'
  WHEN 'Pênis Recheado' THEN 'Produto irreverente e divertido, com casca de chocolate e recheio cremoso para presentear com humor e muito sabor.'
  WHEN 'Trufa 20g' THEN 'Trufa artesanal em porção individual, perfeita para lembrancinhas, kits ou para adoçar o dia a qualquer hora.'
  WHEN 'Vagina recheada' THEN 'Produto criativo e bem-humorado, com chocolate e recheio cremoso para presentes descontraídos e cheios de personalidade.'
  ELSE notes
END
WHERE kind = 'ProdutoVenda'
  AND deleted_at IS NULL
  AND name IN (
    'Barra recheada 350g',
    'Caixa com 10 trufas',
    'Ovo Trufado 350g',
    'Ovo Trufado 500g',
    'Ovo de colher 350g',
    'Ovo de colher 500g',
    'Ovo de colher 750g',
    'Ovo infantil s/ brinde',
    'Pênis Recheado',
    'Trufa 20g',
    'Vagina recheada'
  );

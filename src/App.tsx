import { useState } from 'react';
import './styles/global.css';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod'; //para trabalhar com validações
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from './lib/supabase';
/**
 * TO-DO
 * [x] Validação / transformação
 * [x] Field Array
 * [x] Upload de arquivos
 * [ ] Composition Pattern
 * 
 */

const createUserFormSchema = z.object(
  {
    avatar: z.instanceof(FileList)
      .transform(list => list.item(0)!)
      .refine(file => file!.size <= 5 * 1024 * 1024, 'O arquivo precisa ter menos que 5Mb'),
    name: z.string()
      .nonempty('O nome é obrigatório')
      .transform(name => {
        return name.trim().split(' ').map(word => {
          return word[0].toLocaleUpperCase().concat(word.substring(1))
        }).join(' ')
        // o metodo transfrom é para fazer a formatação 'customizada', ou seja, que nao existe no js (exemplo que existe: toUpperCase). trim() serve para remover qualquer espaçamento que tenha sobrado na esquerda ou direita. split é para dividir nome do sobrenome. e para cada palavra dessa ta sendo feito um map, para pegar a primeira letra e colocar em maiusculo e está concatenando com o restante da palavra a partir do caractere 1.
        // o join é usado para concatenar os elementos de um array em uma única string e retorná-la. 

      }),
    email: z.string()
      .nonempty('O e-mail é obrigatório')
      .email('Formato de e-mail inválido')
      .refine(email => {
        return email.endsWith('@gmail.com')
      }, 'O e-mail precisa ser gmail'), //refine é forma de validar um campo que não tem metodo padrão no zod para isso, ou seja, é uma validação customizada. Nesse caso vai retornar true ou false para aceitar apenas emails que sejam gmail
    password: z.string()
      .min(6, 'A senha precisa ter no mínimo 6 caracteres'),
    techs: z.array(z.object({
      title: z.string().nonempty('O título é obrigatório'),
      knowledge: z.coerce.number().min(1).max(100),
    })).min(2, 'Insira pelo menos 2 tecnologias')
  }
);

type createUserFormData = z.infer<typeof createUserFormSchema>


export default function App() {

  const [output, setOutput] = useState<String>('')

  const {
    register, //questão de performance, ele busca o valor dos inputs apenas quando faz o submit (uncontrolled components), diferente de controlled components (control), onde anota cada vez que o usuario digita algo dentro do input e é armazenado dentro do estado provocando mais renderizações. Então por isso é melhor usar register do q control.

    handleSubmit,
    control,
    formState: { errors }
  } = useForm<createUserFormData>({
    resolver: zodResolver(createUserFormSchema),
  });
  //register (serve para falar quais sao os campos do formulario)


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'techs',
  }) //fields sao os campos; append é para poder adicionar tecnologia e remove para remover.

  const addNewTech = () => {
    append({ title: '', knowledge: 0 })
  }

  const createUser = async (data: createUserFormData) => {
    await supabase.storage.from('form-hook-zod-bucket').upload(data.avatar.name, data.avatar)
    setOutput(JSON.stringify(data, null, 2))
  }


  return (
    <main className="h-screen bg-zinc-950 text-zinc-300 flex flex-col gap-10 items-center justify-center">
      <form
        onSubmit={handleSubmit(createUser)}
        className='flex flex-col gap-4 w-full max-w-xs'>

        <div className='flex flex-col gap-1'>

          <label htmlFor="avatar">Avatar</label>
          <input
            type="file"
            accept='image/*'
            {...register('avatar')}
          />
          {errors.avatar && <span className='text-red-500 text-sm'>{errors.avatar.message}</span>}
        </div>

        <div className='flex flex-col gap-1'>

          <label htmlFor="name">Nome</label>
          <input
            type="text"
            className='border border-zinc-800 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white'
            {...register('name')}
          />
          {errors.name && <span className='text-red-500 text-sm'>{errors.name.message}</span>}
        </div>

        <div className='flex flex-col gap-1'>
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            className='border border-zinc-800 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white'
            {...register('email')}
          />
          {errors.email && <span className='text-red-500 text-sm'>{errors.email.message}</span>}
        </div>

        <div className='flex flex-col gap-1'>
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            className='border border-zinc-800 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white'
            {...register('password')}
          />
          {errors.password && <span className='text-red-500 text-sm'>{errors.password.message}</span>}
        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex justify-between'>
            <label htmlFor=""
              className='flex items-center justify-between'
            >Tecnologias</label>
            <button onClick={addNewTech}
              type="button"
              className='text-emerald-500 text-sm'
            >Adicionar</button>
          </div>
          {fields.map((field, index) => {
            return (
              <div
                className='flex'
                key={field.id}>
                <div className='flex-1 flex flex-col gap-1'>
                  <input
                    type="text"
                    className='border border-zinc-800 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white'
                    {...register(`techs.${index}.title`)}
                  />
                  {errors.techs?.[index]?.title && <span className='text-red-500 text-sm'>{errors.techs?.[index]?.title?.message}</span>}
                </div>

                <div className='flex flex-col gap-1'>

                  <input
                    type="number"
                    className='w-16 border border-zinc-800 shadow-sm rounded h-10 px-3 bg-zinc-900 text-white'
                    {...register(`techs.${index}.knowledge`)}
                  />
                  {errors.techs?.[index]?.knowledge && <span className='text-red-500 text-sm'>{errors.techs?.[index]?.knowledge?.message}</span>}
                </div>

              </div>
            )
          })}
        </div>

        {errors.techs && <span className='text-red-500 text-sm'>{errors.techs.message}</span>}

        <button type='submit'
          className='bg-emerald-500 rounded font-semibold text-white h-10 hover:bg-emerald-600'
        >Salvar</button>
      </form>
      <pre>{output}</pre>
    </main>
  );
}
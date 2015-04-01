// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   computor.js                                        :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: mcanal <zboub@42.fr>                       +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2015/03/26 16:30:28 by mcanal            #+#    #+#             //
//   Updated: 2015/04/01 21:32:05 by mcanal           ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

/*
** "THE BEER-WARE LICENSE" (Revision 42):								oOOOOOo
** JeanMax@github wrote this file. As long as you retain this			,|	 |
** notice you can do whatever you want with this stuff. If we meet	//|	 |
** some day, and you think this stuff is worth it, you can buy me	 \\|	 |
** a beer in return.													`|	 |
**	-JeanMax															`-----`
*/

'use strict';

var debug = 0, //debug'ing purpose : set to 1 to print vars value
	step = 0, //set to 1 to show all processing step
	nb = []; //global array

function arrondi(nb)
{
	var i, swap,
		signe = 1;

	if (nb < 0)
	{
		nb *= -1;
		signe = -1;
	}
	swap = nb;
	for (i = 1; i < 8; i++)
		swap *= 10;
	if (swap % 10 >= 5)
		return signe * (nb + 0.000001);

	return signe * nb;
}

function fillNbTab(arg)
{
	var reg, i, equal, split, sign;

	//splitting tab : first step to locate '='
	reg = new RegExp("[+*]", "g");
	split = arg.split(reg);

	//init "=" location
	equal = 0;
	for (i = 0; i < split.length; i++)
	{
		if (split[i].indexOf("=") > -1)
		{
			equal = i;
			break ;
		}
	}
	if (!equal)
	{
		console.log("Syntax error");
		return false;
	}

	//splitting tab : 2nd step, this is the real one
	reg = new RegExp("[+*=]", "g");
	split = arg.split(reg);

	//actually filling the nb tab
	for (i = 0; i < split.length; i++)
	{
		if (i <= equal)
			sign = 1;
		else
			sign = -1;

		if (split[i + 1] && split[i + 1].indexOf("X") == -1 && split[i].indexOf("X") == -1) //no "x"
			nb['X^0'] += parseFloat(split[i]) * sign;
		else if (!split[i + 1] && split[i].indexOf("X") == -1) //no "x", last entry
			nb['X^0'] += parseFloat(split[i]) * sign;
		else if (i && split[i].indexOf("X^") > -1 && split[i - 1].indexOf("X") > -1) //no multi
			nb[split[i]] += 1 * sign;
		else if (split[i].indexOf("X^") > -1 && !i) //no multplicator, first entry
			nb[split[i]] += 1 * sign;
		else if (split[i].indexOf("X^") > -1) //normal
			nb[split[i]] += parseFloat(split[i - 1]) * sign;
		else if (split[i].indexOf("X") > -1) //no pow
		{
			if (i && split[i - 1].indexOf("X") > -1) //no multiplicator
				nb['X^1'] += 1 * sign;
			else if (!i) //no multplicator, first entry
				nb['X^1'] += 1 * sign;
			else
				nb['X^1'] += parseFloat(split[i - 1]) * sign;
		}
	}

	//... debug!
	if (debug)
	{
		console.log('arg: ', arg); //debug
		console.log('spl: ', split); //debug
		console.log(' nb: ', nb); //debug
	}
	return true;
}

function init()
{
	var arg, i, j, s, reg, tab;

	//pick av
	if (process.argv.length != 3)
	{
		console.log("Syntaax error");
		return false;
	}
	arg = (process.argv.slice(2)).toString();
	
	
	//replace '- ' with '+ -'
	reg = new RegExp("- ", "g");
	arg = arg.replace(reg, "+ -");
	reg = new RegExp(" ", "g");
	arg = arg.replace(reg, "");

	//init nb tab
	nb['X^0'] = 0;
	nb['X^1'] = 0;
	nb['X^2'] = 0;

	//searching greatest pow
	reg = new RegExp("[^ 0-9]", "g");
	tab = arg.split(reg);
	j = 0;
	for (i = 0; i < tab.length; i++)
	{
		if (j < parseInt(tab[i]))
			j = parseInt(tab[i]);
	}
	
	for (i = 0; i <= j; i++)
	{
		s = 'X^'.concat(i.toString());
		if (arg.indexOf(s) > -1)
		{
			//if the power isn't real (seriously)
			if (arg.indexOf(s.concat('.')) > -1)
			{
				console.log("The polynomial degree isn't natural, I can't solve.");
				return false;
			}
			nb[s] = 0;
		}
	}

	//fill nb tab
	if (!fillNbTab(arg))
		return false;

	return true;
}

function print()
{
	var reg, tag, i, j, s = "", zboub;

	//concat the tab in one string
	i = 0;
	for (tag in nb)
	{
		if (nb[tag].toFixed(6) != 0)
		{
			if (i != 0)
				s = s.concat(" + ");
			s = s.concat(arrondi(nb[tag].toFixed(6)).toString());
			if (tag != 'X^0')
			{
				s = s.concat(" * ");
				if (tag == 'X^1')
					s = s.concat('X')
				else
					s = s.concat(tag);
			}
			i++;
		}
		//replace '+ -' with '- '
		s = s.replace("\+ \-", "- "); //loop'ed to avoid regexp...
	}
	if (!i)
		s = "0"
	s = s.concat(" = 0");
	console.log("Reduced form:", s);
	i--;

	//ignore last degree(s) if multiplicator = 0
	for (j = i; j >= 0 && i; j--)
  	{
		if (!nb['X^'.concat(j.toString())])
			i--;
		else
			break ;
	}
	console.log("Polynomial degree:", i);

	//handling degree 1 and 0
	if (i > 2)
	{
		console.log("The polynomial degree is stricly greater than 2, I can't solve.");
		return false;
	}
	else if ((i === 1 || !nb['X^2']) && nb['X^1'])	// ax + b = 0	->	x = -b / a
	{
		console.log("The solution is:");
		console.log(arrondi(((nb['X^0'] * -1) / nb['X^1']).toFixed(6)));
		return false;
	}
	else if ((i === 0 || (!nb['X^2'] && !nb['X^0'])) && nb['X^0']) // b = 0	->
	{
		console.log("There is no solution");
		return false;
	}
	else if ((i === 0 || (!nb['X^2'] && !nb['X^0'])) && !nb['X^0']) // b = 0	->
	{
		console.log("The solution is |R");
		return false;
	}
	return true;
}

function racine(n)
{
	var i = 0;
	var p = 1;

	if (n < 0)
		n *= -1;
	else if (n == 0)
		return 0;
	while (p > 0.00000001)
	{
		while (i * i <= n)
		{
			i += p;
		}
		if (i * i == n)
			return i;
		i -= p;
		p /= 10;
	}
	return i;
}

function zboub(s)
{
	if (s.indexOf('.') != -1)
		return s.indexOf('.') + 7;
	else
		return s.length;
}

function signe(s)
{
	if (s.charAt(0) == '-')
		return ('-');
	return ('+');
}

function solutions()
{
	var delta = nb['X^1'] * nb['X^1'] - 4 * nb['X^2'] * nb['X^0'],
		r = racine(delta),
		s1, s2, s1i, s2i;

	if (step)
	{
		console.log("a =", nb['X^2'].toString().substr(0, zboub(nb['X^2'].toString())));
		console.log("b =", nb['X^1'].toString().substr(0, zboub(nb['X^1'].toString())));
		console.log("c =", nb['X^0'].toString().substr(0, zboub(nb['X^0'].toString())));
		console.log("delta = b^2 - 4ac =", delta.toString().substr(0, zboub(delta.toString())));
	}
	if (delta > 0)
	{
		if (step)
			console.log("racine(delta) =", r.toString().substr(0, zboub(r.toString())));
		console.log("Discriminant is strictly positive, the two solutions are:");
		s1 = arrondi((-nb['X^1'] - r) / (2 * nb['X^2'])).toString();
		s2 = arrondi((-nb['X^1'] + r) / (2 * nb['X^2'])).toString();
		console.log(s1.substr(0, zboub(s1)));
		console.log(s2.substr(0, zboub(s2)));
	}
	else if (delta == 0)
	{
		console.log("Discriminant is null, the solution is:");
		s1 = arrondi(-nb['X^1'] / (2 * nb['X^2'])).toString();
		console.log(s1.substr(0, zboub(s1)));
	}
	else
	{
		if (step)
			console.log("racine(delta) =", r.toString().substr(0, zboub(r.toString())), "i");
		console.log("Discriminant is negative, the two complexe solutions are:");
		s1 = arrondi(-nb['X^1'] / (2 * nb['X^2'])).toString();
		s1i = arrondi(-r / (2 * nb['X^2'])).toString();
		s2i = arrondi(r / (2 * nb['X^2'])).toString();
		console.log(s1.substr(0, zboub(s1)), signe(s1i), signe(s1i) == '-' ? s1i.substr(1, zboub(s1i) - 1) : s1i.substr(0, zboub(s1i)), "i");
		console.log(s1.substr(0, zboub(s1)), signe(s2i), signe(s2i) == '-' ? s2i.substr(1, zboub(s2i) - 1) : s2i.substr(0, zboub(s2i)), "i");
	}
}

// "MAIN"
if (init())
	if (print())
		solutions();
